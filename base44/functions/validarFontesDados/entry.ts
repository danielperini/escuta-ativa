import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// =================================================================
// validarFontesDados — Camada central de validação técnica e de
// qualidade das fontes públicas/internas cadastradas na societá.ai.
//
// Para cada fonte registrada:
//   1. Teste técnico (HTTP ou IA) usando município-amostra real.
//   2. Validação de schema/estrutura esperada.
//   3. Avaliação de coerência via IA (sem inventar/corrigir valores,
//      apenas sinaliza inconsistência de magnitude/município/período).
//   4. Atualiza status em FonteDados.
//   5. Política de falhas: 1=alerta, 2=DEGRADADA, 3=INDISPONIVEL+oculta.
// =================================================================

const SAMPLE = { nome: 'Belo Horizonte', uf: 'MG', ibge: '3106200' };

const SOURCES = [
  {
    source_id: 'IBGE_LOCALIDADES',
    source_name: 'IBGE — Localidades / municípios',
    category: 'demografia',
    endpoint: 'https://servicodados.ibge.gov.br/api/v1/localidades',
    requires_auth: false,
    tipo: 'http',
    test_url: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${SAMPLE.ibge}`,
    validator: 'ibgeLocalidades',
  },
  {
    source_id: 'SICONFI',
    source_name: 'SICONFI — Tesouro Nacional (RGF)',
    category: 'fiscal',
    endpoint: 'https://apidatalake.tesouro.gov.br/ords/siconfi',
    requires_auth: false,
    tipo: 'http',
    test_url: `https://apidatalake.tesouro.gov.br/ords/siconfi/api/rgf?an_exercicio=2023&id_ente=${SAMPLE.ibge}`,
    validator: 'siconfi',
  },
  {
    source_id: 'PORTAL_TRANSPARENCIA',
    source_name: 'Portal da Transparência',
    category: 'fiscal',
    endpoint: 'https://api.portaldatransparencia.gov.br/api-de-dados',
    requires_auth: true,
    tipo: 'http',
    test_url: 'https://api.portaldatransparencia.gov.br/api-de-dados/orgaos-siafi?codigoSiafi=72053&pagina=1',
    validator: 'transparent',
  },
  {
    source_id: 'IA_TERRITORIAL',
    source_name: 'IA societá.ai — pesquisa web (gemini_3_flash)',
    category: 'resumo',
    endpoint: 'InvokeLLM gemini_3_flash + web search',
    requires_auth: false,
    tipo: 'ai',
  },
];

async function testarHTTP(src) {
  const t0 = Date.now();
  try {
    const headers = { 'Accept': 'application/json' };
    if (src.requires_auth) {
      let key = '';
      try { key = secrets.get('PORTAL_TRANSPARENCIA_CHAVE') || ''; } catch (_) { key = ''; }
      if (!key) {
        return {
          status: 'ERRO_DE_AUTENTICACAO',
          http_status: null,
          response_time_ms: null,
          error_message: 'Sem chave de API configurada (secret PORTAL_TRANSPARENCIA_CHAVE ausente)',
          sample_result_count: 0,
          sample_data: null,
          schema_valid: false,
          coherence: null,
        };
      }
      headers['chave-api-dados'] = key;
    }
    const res = await fetch(src.test_url, { headers });
    const response_time_ms = Date.now() - t0;
    const http_status = res.status;
    if (!res.ok) {
      return {
        status: http_status === 404 ? 'SEM_DADOS_PARA_O_MUNICIPIO' : 'ERRO_DE_ENDPOINT',
        http_status,
        response_time_ms,
        error_message: `HTTP ${http_status}`,
        sample_result_count: 0,
        sample_data: null,
        schema_valid: false,
        coherence: null,
      };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        status: 'RESPOSTA_INVALIDA',
        http_status,
        response_time_ms,
        error_message: `Content-Type inesperado: ${contentType}`,
        sample_result_count: 0,
        sample_data: null,
        schema_valid: false,
        coherence: null,
      };
    }
    const json = await res.json();
    let sample_result_count = 0;
    let sample_data = null;
    let schema_valid = false;

    if (src.validator === 'ibgeLocalidades') {
      schema_valid =
        (!!json?.id || !!json?.municipio?.id) &&
        /Belo Horizonte/i.test(json?.nome || json?.municipio?.nome || '');
      sample_result_count = 1;
      sample_data = json;
    } else if (src.validator === 'siconfi') {
      const items = Array.isArray(json?.items) ? json.items : [];
      sample_result_count = items.length;
      schema_valid = items.length > 0 && (!!items[0]?.co_municipio || !!items[0]?.co_ente);
      sample_data = items[0] || null;
    } else if (src.validator === 'transparent') {
      const items = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [json];
      sample_result_count = items.length;
      schema_valid = items.length > 0;
      sample_data = items[0] || null;
    } else {
      schema_valid = !!json;
      sample_result_count = 1;
      sample_data = json;
    }

    if (!schema_valid) {
      return {
        status: 'RESPOSTA_INVALIDA',
        http_status,
        response_time_ms,
        error_message: 'Schema não corresponde ao esperado para esta fonte',
        sample_result_count,
        sample_data,
        schema_valid: false,
        coherence: null,
      };
    }
    return {
      status: 'ATIVA',
      http_status,
      response_time_ms,
      error_message: null,
      sample_result_count,
      sample_data,
      schema_valid: true,
      coherence: null,
    };
  } catch (e) {
    return {
      status: 'INDISPONIVEL',
      http_status: null,
      response_time_ms: Date.now() - t0,
      error_message: e?.name === 'AbortError' ? 'Timeout' : (e?.message || 'Falha na requisição'),
      sample_result_count: 0,
      sample_data: null,
      schema_valid: false,
      coherence: null,
    };
  }
}

async function testarIA(base44) {
  const t0 = Date.now();
  try {
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Responda em uma frase curta (até 200 caracteres): qual o nome do município brasileiro de código IBGE ${SAMPLE.ibge}?`,
      add_context_from_internet: false,
      model: 'gemini_3_flash',
    });
    const response_time_ms = Date.now() - t0;
    const texto = typeof r === 'string' ? r : (r?.content || r?.text || JSON.stringify(r));
    if (!texto || texto.length < 5) {
      return {
        status: 'SEM_DADOS_PARA_O_MUNICIPIO',
        http_status: 200,
        response_time_ms,
        error_message: 'IA retornou resposta vazia',
        sample_result_count: 0,
        sample_data: null,
        schema_valid: false,
        coherence: null,
      };
    }
    if (!/Belo Horizonte|3106200|BH/i.test(texto)) {
      return {
        status: 'RESPOSTA_INVALIDA',
        http_status: 200,
        response_time_ms,
        error_message: 'IA não identificou o município correto na amostra',
        sample_result_count: 1,
        sample_data: { resposta: texto.substring(0, 800) },
        schema_valid: false,
        coherence: null,
      };
    }
    return {
      status: 'ATIVA',
      http_status: 200,
      response_time_ms,
      error_message: null,
      sample_result_count: 1,
      sample_data: { resposta: texto.substring(0, 800) },
      schema_valid: true,
      coherence: null,
    };
  } catch (e) {
    return {
      status: 'INDISPONIVEL',
      http_status: null,
      response_time_ms: Date.now() - t0,
      error_message: e?.name === 'AbortError' ? 'Timeout IA' : (e?.message || 'Falha IA'),
      sample_result_count: 0,
      sample_data: null,
      schema_valid: false,
      coherence: null,
    };
  }
}

async function avaliarCoerenciaIA(base44, src, sample_data) {
  if (!sample_data) {
    return { consistente: null, magnitude_ok: null, observacao: 'Sem amostra para avaliar' };
  }
  try {
    const sampleStr = (typeof sample_data === 'string' ? sample_data : JSON.stringify(sample_data)).substring(0, 1400);
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Validação técnica de coerência de dados de fonte governamental brasileira (${src.source_name}) retornados para município-amostra ${SAMPLE.nome}/${SAMPLE.uf} (IBGE ${SAMPLE.ibge}). Avalie:
- O município retornado corresponde ao consultado?
- Unidade de medida faz sentido?
- Período de referência está presente?
- Valores plausíveis em magnitude?
- Há inconsistência evidente?
NÃO corrija valores. Apenas sinalize. Responda em JSON.

Amostra:
${sampleStr}`,
      model: 'gpt_5_mini',
      response_json_schema: {
        type: 'object',
        properties: {
          consistente: { type: 'boolean' },
          magnitude_ok: { type: 'boolean' },
          observacao: { type: 'string' },
        },
      },
    });
    return r || { consistente: null, magnitude_ok: null, observacao: 'IA sem resposta' };
  } catch (e) {
    return { consistente: null, magnitude_ok: null, observacao: 'Erro IA coerência: ' + (e?.message || 'desconhecido') };
  }
}

function derivarStatusFinal(resultado, coherence) {
  if (resultado.status !== 'ATIVA') return resultado.status;
  if (coherence.consistente === false) return 'RESPOSTA_INVALIDA';
  return 'ATIVA';
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    // Permite: admin autenticado (manual) e sessões sem usuário (workflow agendado).
    // Bloqueia usuários não-admin tentando chamar diretamente.
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Acesso administrador exigido' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apenasSourceId = body?.source_id ? String(body.source_id) : null;

    const db = base44.asServiceRole.entities.FonteDados;
    const allExisting = await db.list();
    const existenteMap = new Map();
    allExisting.forEach((r) => existenteMap.set(r.source_id, r));

    const aTestar = apenasSourceId
      ? SOURCES.filter((s) => s.source_id === apenasSourceId)
      : SOURCES;

    const results = [];
    for (const src of aTestar) {
      let resultado;
      if (src.tipo === 'http') {
        resultado = await testarHTTP(src);
      } else if (src.tipo === 'ai') {
        resultado = await testarIA(base44);
      } else {
        resultado = {
          status: 'EM_TESTE',
          http_status: null,
          response_time_ms: null,
          error_message: 'Tipo de teste não implementado',
          sample_result_count: 0,
          sample_data: null,
          schema_valid: false,
          coherence: null,
        };
      }

      let coherence = { consistente: null, magnitude_ok: null, observacao: null };
      if (resultado.status === 'ATIVA' && resultado.sample_data) {
        coherence = await avaliarCoerenciaIA(base44, src, resultado.sample_data);
      }
      const finalStatus = derivarStatusFinal(resultado, coherence);

      const anterior = existenteMap.get(src.source_id);
      const prevFail = anterior?.consecutive_failures || 0;
      const consecutive_failures = finalStatus === 'ATIVA' ? 0 : Math.min(prevFail + 1, 999);

      let status_exposto = finalStatus;
      if (consecutive_failures === 2 && finalStatus !== 'ATIVA') status_exposto = 'DEGRADADA';
      const visivel = status_exposto === 'ATIVA' || (status_exposto === 'DEGRADADA');
      const deactivated = consecutive_failures >= 3;
      if (deactivated) {
        status_exposto = 'INDISPONIVEL';
      }

      const registro = {
        source_id: src.source_id,
        source_name: src.source_name,
        category: src.category,
        endpoint: src.endpoint,
        requires_auth: !!src.requires_auth,
        status: status_exposto,
        status_tecnico: finalStatus,
        last_test_at: new Date().toISOString(),
        response_time_ms: resultado.response_time_ms,
        http_status: resultado.http_status,
        error_message: resultado.error_message,
        sample_municipality: SAMPLE.nome,
        sample_result_count: resultado.sample_result_count,
        schema_valid: !!resultado.schema_valid,
        data_valid: finalStatus === 'ATIVA' && coherence.consistente !== false,
        coherence_observacao: coherence.observacao || '',
        coherence_consistente: coherence.consistente,
        coherence_magnitude_ok: coherence.magnitude_ok,
        consecutive_failures,
        visible: visivel && !deactivated,
        deactivated,
      };

      if (anterior) {
        await db.update(anterior.id, registro);
      } else {
        await db.create(registro);
      }

      results.push({
        source_id: src.source_id,
        status: status_exposto,
        status_tecnico: finalStatus,
        response_time_ms: resultado.response_time_ms,
        sample_result_count: resultado.sample_result_count,
        coherence: coherence.observacao,
      });
    }

    const atual = await db.list();
    const ativas = atual.filter((r) => r.status === 'ATIVA').length;
    const total = atual.length;
    const indisponiveis = atual.filter((r) => !r.visible).length;

    return Response.json({
      success: true,
      total_testadas: aTestar.length,
      total_fontes_cadastradas: total,
      ativas,
      indisponiveis,
      coverage_percent: total > 0 ? Math.round((ativas / total) * 100) : 0,
      results,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Erro inesperado' }, { status: 500 });
  }
}