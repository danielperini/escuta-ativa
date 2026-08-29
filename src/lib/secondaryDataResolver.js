// ================================================================
//  secondaryDataResolver.js
//  Pipeline central de coleta de Dados Secundários.
//  - classificarErro: converte erros técnicos (503, timeout, etc) em status semântico
//  - resolverSeccao: cache -> API oficial direta -> IA/web (pesquisarDadosTerritoriais)
//    com retry controlado, fallback automático e cache-emergência
//  - Não expõe mensagens técnicas cruas ao usuário comum.
// ================================================================

import {
  coletarDemografiaIBGE,
  registrarDemografiaEmCache,
  buscarTodosCaches,
  pesquisarViaIA,
  FONTES
} from '@/lib/publicTerritorialDataService';

export const STATUS_DADO = {
  DADO_DISPONIVEL: 'DADO_DISPONIVEL',
  SOURCE_TEMPORARILY_UNAVAILABLE: 'SOURCE_TEMPORARILY_UNAVAILABLE',
  SEM_COBERTURA: 'SEM_COBERTURA',
  DADO_NAO_LOCALIZADO: 'DADO_NAO_LOCALIZADO'
};

// Padrões para classificar textos de erro técnicos em categorias de estado.
const PADRAO_TEMP = /(503|502|504|408|timeout|etimedout|econnreset|enotfound|network error|endpoint indispon|api temporariamente fora|request failed with status|aborterror|service unavailable|bad gateway|gateway timeout)/i;
const PADRAO_COBERTURA = /(sem cobertura|nao atende|not cover|no coverage|sem dados para o muni|for this municip|not applicable)/i;
const PADRAO_VAZIO = /(sem dados|no data|empty|no records|not found|nao encontra|not located|sem resultado)/i;
const PADRAO_CREDITO = /(limit of integrat|cota|creditos|credits|plano)/i;

// HTTP status code -> estado semântico
function porStatus(status) {
  if ([502, 503, 504, 408, 500, 429].includes(status)) return STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE;
  if (status === 404) return STATUS_DADO.SEM_COBERTURA;
  if (status === 402) return STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE; // limite de créditos IA: tratamento degradação
  return null;
}

export function classificarErro(err) {
  if (!err) return 'UNKNOWN';
  const msg = typeof err === 'string' ? err : (err.message || (err.toString && err.toString()) || '');
  const status = (err && (err.status || err.statusCode || (err.response && err.response.status))) || null;
  const estadoStatus = porStatus(status);
  if (estadoStatus) return estadoStatus;
  if (PADRAO_CREDITO.test(msg)) return STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE;
  if (PADRAO_TEMP.test(msg)) return STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE;
  if (PADRAO_COBERTURA.test(msg)) return STATUS_DADO.SEM_COBERTURA;
  if (PADRAO_VAZIO.test(msg)) return STATUS_DADO.DADO_NAO_LOCALIZADO;
  return 'UNKNOWN';
}

// Verifica se cache é fresco (<= 30 dias)
function cacheFresco(items) {
  if (!items || items.length === 0) return false;
  const updated = items[0] && (items[0].updated_at || items[0].collected_at);
  if (!updated) return true; // assume fresco se não há timestamp
  const dias = (Date.now() - new Date(updated).getTime()) / 86400000;
  return dias <= 30;
}

function ultimaData(items) {
  if (!items || items.length === 0) return null;
  const r = items[0];
  return (r.updated_at || r.collected_at) || null;
}

function primeiraFonte(items) {
  if (!items || items.length === 0) return null;
  return items[0].source_name || null;
}

// Pipeline principal
export async function resolverSeccao({ mun, categoria, fontesSel, forceRefresh }) {
  const ibge = mun && mun.ibge;
  const uf = mun && mun.uf;
  const nome = mun && mun.nome;
  if (!ibge) {
    return {
      items: [], status: STATUS_DADO.SEM_COBERTURA, fonte_final: null,
      ultimaAtual: null, erro_class: 'no_ibge', aviso_validade: null,
      tentativas: []
    };
  }

  const tentativas = [];
  const fontesNomes = (fontesSel && fontesSel.length
    ? FONTES.filter(f => fontesSel.includes(f.id))
    : FONTES).map(f => f.nome);

  // PASSO 1: Cache fresco
  const cache = await buscarTodosCaches([ibge], categoria);
  const cacheItems = (cache && cache[ibge]) || [];
  const fresco = cacheFresco(cacheItems);
  if (cacheItems.length > 0 && fresco && !forceRefresh) {
    return {
      items: cacheItems,
      status: STATUS_DADO.DADO_DISPONIVEL,
      fonte_final: primeiraFonte(cacheItems) || 'Fonte pública (cache)',
      ultimaAtual: ultimaData(cacheItems),
      erro_class: null,
      aviso_validade: null,
      tentativas: ['cache_fresco']
    };
  }

  // PASSO 2: API direta (somente demografia — IBGE)
  let erroClassificacao = null;
  if (categoria === 'demografia') {
    tentativas.push('ibge_api');
    try {
      const demografia = await coletarDemografiaIBGE(ibge, uf);
      if (demografia && demografia.error) throw new Error(demografia.error);
      await registrarDemografiaEmCache(ibge, nome, uf, demografia);
      const cache2 = await buscarTodosCaches([ibge], 'demografia');
      if (cache2 && cache2[ibge] && cache2[ibge].length > 0) {
        return {
          items: cache2[ibge],
          status: STATUS_DADO.DADO_DISPONIVEL,
          fonte_final: 'IBGE / SIDRA',
          ultimaAtual: new Date().toISOString(),
          erro_class: null,
          aviso_validade: null,
          tentativas
        };
      }
    } catch (e) {
      erroClassificacao = classificarErro(e);
    }
  }

  // PASSO 3: IA/web com retry controlado — fallback automático
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    tentativas.push('ia_web_' + tentativa);
    try {
      const res = await pesquisarViaIA({
        ibge_code: ibge,
        municipio: nome,
        uf,
        categoria,
        fontes: fontesNomes,
        force_refresh: forceRefresh && tentativa === 1
      });
      if (res && res.error) throw new Error(res.error);
      const cacheFinal = await buscarTodosCaches([ibge], categoria);
      if (cacheFinal && cacheFinal[ibge] && cacheFinal[ibge].length > 0) {
        return {
          items: cacheFinal[ibge],
          status: STATUS_DADO.DADO_DISPONIVEL,
          fonte_final: primeiraFonte(cacheFinal[ibge]) || 'IA / Web (fontes oficiais)',
          ultimaAtual: ultimaData(cacheFinal[ibge]) || new Date().toISOString(),
          erro_class: null,
          aviso_validade: null,
          tentativas
        };
      }
      return {
        items: [], status: STATUS_DADO.SEM_COBERTURA, fonte_final: null,
        ultimaAtual: null, erro_class: 'no_data_returned', aviso_validade: null,
        tentativas
      };
    } catch (e) {
      erroClassificacao = classificarErro(e);
      if (erroClassificacao !== STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE) break;
      if (tentativa < 2) await new Promise(r => setTimeout(r, 500 * tentativa));
    }
  }

  // PASSO 4: Cache antigo com aviso de indisponibilidade
  if (cacheItems.length > 0) {
    return {
      items: cacheItems,
      status: STATUS_DADO.DADO_DISPONIVEL,
      fonte_final: (primeiraFonte(cacheItems) || 'Fonte') + ' (cache em emergência)',
      ultimaAtual: ultimaData(cacheItems),
      erro_class: erroClassificacao,
      aviso_validade: 'Exibindo cache — a fonte principal está temporariamente indisponível.',
      tentativas
    };
  }

  // PASSO 5: Estado final legível — sem dado disponível
  let statusFinal = erroClassificacao || STATUS_DADO.DADO_NAO_LOCALIZADO;
  if (statusFinal === 'UNKNOWN') statusFinal = STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE;
  return {
    items: [], status: statusFinal, fonte_final: null,
    ultimaAtual: null, erro_class: erroClassificacao, aviso_validade: null,
    tentativas
  };
}

export const STATUS_LABEL = {
  [STATUS_DADO.DADO_DISPONIVEL]: 'Dado disponível',
  [STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE]: 'Fonte temporariamente indisponível',
  [STATUS_DADO.SEM_COBERTURA]: 'Sem cobertura municipal',
  [STATUS_DADO.DADO_NAO_LOCALIZADO]: 'Dado não localizado para este território'
};

export const STATUS_COR = {
  [STATUS_DADO.DADO_DISPONIVEL]: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  [STATUS_DADO.SOURCE_TEMPORARILY_UNAVAILABLE]: 'text-amber-700 bg-amber-50 border-amber-100',
  [STATUS_DADO.SEM_COBERTURA]: 'text-slate-700 bg-slate-50 border-slate-200',
  [STATUS_DADO.DADO_NAO_LOCALIZADO]: 'text-slate-500 bg-slate-50 border-slate-200'
};