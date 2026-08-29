// ================================================================
//  secondaryDataResolver.js
//  MOTOR UNIVERSAL DE COLETA TERRITORIAL.
//  Nunca expõe erros técnicos (503, timeout) ao usuário. Quando as
//  camadas falham, continua tentando a próxima. Só devolve SEM_DADO
//  quando TODAS as camadas foram tentadas e nada foi encontrado.
//
//  Hierarquia por indicador:
//   1. Cache fresco (DadoSecundario, ≤ 30 dias)        — method: CACHE
//   2. API oficial direta (ex: IBGE para demografia)   — method: API
//   3. Backend pesquisarDadosTerritoriais (IA+web)     — method: PESQUISA_WEB_IA
//   4. IA Discovery (frontend ampliar)                 — method: PESQUISA_WEB_IA
//   5. Cache antigo (em emergência, com aviso)         — method: CACHE
//   6. SEM_DADO final                                  — validation_status: sem_consulta
// ================================================================

import { base44 } from '@/api/base44Client';
import {
  coletarDemografiaIBGE,
  registrarDemografiaEmCache,
  buscarTodosCaches,
  pesquisarViaIA,
  FONTES
} from '@/lib/publicTerritorialDataService';
import { ampliarPesquisa } from '@/lib/territorialSourceDiscoveryService';

export const STATUS_DADO = {
  BUSCANDO: 'BUSCANDO',                          // intermediário: tentando fontes
  DADO_DISPONIVEL: 'DADO_DISPONIVEL',            // sucesso
  EMERGENCIA_CACHE: 'EMERGENCIA_CACHE',          // cache antigo + fonte indisponível
  SEM_DADO: 'SEM_DADO'                            // final: tentou tudo, não encontrou
};

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

function cacheFresco(upd) {
  if (!upd) return false;
  return (Date.now() - new Date(upd).getTime()) < TRINTA_DIAS_MS;
}

function ultimaData(items) {
  if (!items || items.length === 0) return null;
  return items[0]?.updated_at || items[0]?.collected_at || null;
}

function primeiraFonte(items) {
  if (!items || items.length === 0) return null;
  // Pula o "Resumo Executivo" para indicar a fonte dos indicadores
  const ind = items.find(i => i.indicator !== 'Resumo Executivo Territorial' && !(i.source_id || '').startsWith('IA_INSIGHT'));
  return ind?.source_name || items[0]?.source_name || null;
}

function rotularMethod(item) {
  // Garante method em todos os itens vindos do cache antigo (sem method)
  if (item && !item.method) return { ...item, method: 'CACHE' };
  return item;
}

// Pipeline principal
export async function resolverSeccao({ mun, categoria, fontesSel, forceRefresh, ampliarExtra }) {
  const ibge = mun && mun.ibge;
  const uf = mun && mun.uf;
  const nome = mun && mun.nome;
  if (!ibge) {
    return { items: [], status: STATUS_DADO.SEM_DADO, fonte_final: null,
             ultimaAtual: null, aviso_validade: null, erro_class: 'no_ibge', method: null };
  }
  const tentativas = [];
  const fontesNomes = (fontesSel && fontesSel.length
    ? FONTES.filter(f => fontesSel.includes(f.id))
    : FONTES).map(f => f.nome);

  // ── Camada 1: Cache fresco ───────────────────────────────────
  if (!ampliarExtra) {
    const cacheItems = await buscarTodosCaches([ibge], categoria);
    const items = (cacheItems && cacheItems[ibge]) || [];
    if (items.length > 0) {
      const upd = items[0]?.updated_at || items[0]?.collected_at;
      if (cacheFresco(upd) && !forceRefresh) {
        return {
          items: items.map(rotularMethod),
          status: STATUS_DADO.DADO_DISPONIVEL,
          fonte_final: primeiraFonte(items) || 'Fonte pública (cache)',
          ultimaAtual: upd,
          aviso_validade: null,
          erro_class: null
        };
      }
    }
  }

  // ── Camada 2: API oficial direta (somente demografia — IBGE) ─
  let erroClassificacao = null;
  if (categoria === 'demografia' && !ampliarExtra) {
    tentativas.push('ibge_api');
    try {
      const demografia = await coletarDemografiaIBGE(ibge, uf);
      if (demografia && demografia.error) throw new Error(demografia.error);
      if (demografia?.populacao != null || demografia?.area_densidade) {
        await registrarDemografiaEmCache(ibge, nome, uf, demografia);
        const cacheItems = await buscarTodosCaches([ibge], 'demografia');
        const items = (cacheItems && cacheItems[ibge]) || [];
        if (items.length > 0) {
          return {
            items: items.map(rotularMethod),
            status: STATUS_DADO.DADO_DISPONIVEL,
            fonte_final: 'IBGE / SIDRA',
            ultimaAtual: new Date().toISOString(),
            aviso_validade: null,
            erro_class: null,
            tentativas: ['ibge_api']
          };
        }
      }
    } catch (e) {
      erroClassificacao = classifyErr(e);
      // Não expõe: continua para próxima camada
    }
  }

  // ── Camada 3: Backend pesquisarDadosTerritoriais (IA+web) ────
  if (!ampliarExtra) {
    tentativas.push('backend_ia');
    try {
      const res = await pesquisarViaIA({
        ibge_code: ibge, municipio: nome, uf, categoria,
        fontes: fontesNomes, force_refresh: !!forceRefresh
      });
      if (res && res.error) throw new Error(res.error);
      const cacheItems = (res.items || []).filter(it => it && !(it.error));
      if (cacheItems.length > 0) {
        return {
          items: cacheItems.map(rotularMethod),
          status: STATUS_DADO.DADO_DISPONIVEL,
          fonte_final: primeiraFonte(cacheItems) || 'IA / Web (fontes oficiais)',
          ultimaAtual: ultimaData(cacheItems) || new Date().toISOString(),
          aviso_validade: null,
          erro_class: null,
          tentativas
        };
      }
      // res.warning (cache em emergência já vinha do backend)
      if (res?.warning) erroClassificacao = 'cache_emergencia_no_backend';
    } catch (e) {
      erroClassificacao = classifyErr(e);
    }
  }

  // ── Camada 4: IA Discovery (frontend ampliar — sempre sobre fontes oficiais) ──
  tentativas.push('ia_discovery');
  try {
    const r = await ampliarPesquisa({ municipio: nome, uf, ibge, categoria, pergunta: ampliarExtra });
    if (Array.isArray(r.items) && r.items.length > 0) {
      try {
        // Persiste em cache para uso futuro
        const now = new Date().toISOString();
        await base44.entities.DadoSecundario.bulkCreate(
          r.items.map(it => ({
            source_id: `${categoria}_${String(it.indicator).slice(0, 40).replace(/\s+/g, '_')}_${ibge}_${Math.floor(Math.random() * 9999)}`,
            source_name: it.source_name || 'Pesquisa assistida por IA',
            municipality_ibge_code: ibge,
            municipality: nome,
            state: uf,
            category: categoria,
            indicator: it.indicator,
            value_number: it.value_number,
            value_text: it.value_text,
            unit: it.unit,
            reference_period: it.reference_period,
            source_url: it.source_url,
            orgao: it.orgao,
            collected_at: now,
            updated_at: now,
            confidence: it.confidence,
            method: 'PESQUISA_WEB_IA',
            validation_status: it.validation_status,
            geographic_level: it.geographic_level || 'MUNICIPAL',
            raw_metadata: { observacao: it.observacao || '' }
          }))
        );
      } catch (_) { /* persistência falha é aceitável — dados voltam para UI */ }
      return {
        items: r.items,
        status: STATUS_DADO.DADO_DISPONIVEL,
        fonte_final: primeiraFonte(r.items) || 'Pesquisa assistida por IA (fontes oficiais)',
        ultimaAtual: new Date().toISOString(),
        aviso_validade: null,
        erro_class: null,
        tentativas
      };
    }
  } catch (e) {
    erroClassificacao = classifyErr(e);
  }

  // ── Camada 5: Cache antigo em emergência (com aviso) ─────────
  if (!ampliarExtra) {
    const cacheItems = await buscarTodosCaches([ibge], categoria);
    const items = (cacheItems && cacheItems[ibge]) || [];
    if (items.length > 0) {
      return {
        items: items.map(rotularMethod),
        status: STATUS_DADO.EMERGENCIA_CACHE,
        fonte_final: (primeiraFonte(items) || 'Fonte') + ' (cache em emergência)',
        ultimaAtual: ultimaData(items),
        aviso_validade: 'Exibindo último dado disponível em cache — não foi possível atualizar a coleta agora.',
        erro_class: erroClassificacao,
        tentativas
      };
    }
  }

  // ── Camada 6: SEM_DADO final ─────────────────────────────────
  return {
    items: [],
    status: STATUS_DADO.SEM_DADO,
    fonte_final: null,
    ultimaAtual: null,
    aviso_validade: null,
    erro_class: 'tentou_todas_camadas',
    tentativas
  };
}

function classifyErr(err) {
  if (!err) return 'unknown';
  const msg = (typeof err === 'string' ? err : (err.message || '')) + '';
  if (/\b50[0-9]\b|502|503|504|timeout|etimedout|econnreset|abort|service unavail|bad gateway|request failed with status/i.test(msg)) return 'fonte_oficial_indisponivel';
  if (/credit|limit of integrat|cota|quota/i.test(msg)) return 'credito_ia_esgotado';
  if (/not found|nao encontra|empty|no data|no records/i.test(msg)) return 'sem_dados_pa';
  return 'erro_desconhecido';
}

export const STATUS_LABEL = {
  [STATUS_DADO.BUSCANDO]: 'Buscando fontes disponíveis…',
  [STATUS_DADO.DADO_DISPONIVEL]: 'Dado disponível',
  [STATUS_DADO.EMERGENCIA_CACHE]: 'Cache em emergência',
  [STATUS_DADO.SEM_DADO]: 'Não localizamos informação confiável para este indicador neste território.'
};

export const STATUS_COR = {
  [STATUS_DADO.BUSCANDO]: 'text-blue-700 bg-blue-50 border-blue-100',
  [STATUS_DADO.DADO_DISPONIVEL]: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  [STATUS_DADO.EMERGENCIA_CACHE]: 'text-amber-700 bg-amber-50 border-amber-100',
  [STATUS_DADO.SEM_DADO]: 'text-slate-700 bg-slate-50 border-slate-200'
};

// Reutilizado pela página DadosSecundarios quando o usuário clica "Ampliar pesquisa"
export async function ampliar({ mun, categoria, pergunta }) {
  return resolverSeccao({
    mun, categoria, ampliarExtra: pergunta || 'descritivo geral'
  });
}