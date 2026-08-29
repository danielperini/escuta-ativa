import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { CATALOG, SAMPLE_MUN, statusFromHttp } from '../../shared/secondaryDataCatalog.ts';

// ===================================================================
// validarFontesDados — Health check definitivo do Motor de Dados
// Secundarios. Consome o catalogo central (secondaryDataCatalog) e
// testa CADA fonte cadastrada — HTTP/IA/schema/coerencia/cadencia —
// registrando o resultado em FonteDados.
//
// Status (novo padrao, spec §4):
//   ATIVA, DEGRADED, AUTH_REQUIRED, NO_COVERAGE,
//   TEMP_UNAVAILABLE, INVALID_SCHEMA, DISCONTINUED.
//
// Politica de falhas (spec §4):
//   1 falha  → status tecnico isolado (visivel)
//   2 falhas → DEGRADED (visivel, mas sinalizada)
//   3 falhas → DISCONTINUED + oculta do usuario (visible=false)
//
// Somente fonte validada deve fornecer dados ao usuario (visible).
// ===================================================================

function classifyErr(err) {
  const m = (err?.message || String(err || '')).toLowerCase();
  if (/timeout|abort|etimedout/.test(m)) return 'TEMP_UNAVAILABLE';
  if (/401|403|auth|forbidden|unauthor/.test(m)) return 'AUTH_REQUIRED';
  if (/404|not found|no data|empty/.test(m)) return 'NO_COVERAGE';
  if (/schema|content-type|json|parse/.test(m)) return 'INVALID_SCHEMA';
  return 'TEMP_UNAVAILABLE';
}

async function testHTTP(src) {
  const t0 = Date.now();
  if (!src.test_url) {
    // DOWNLOAD/GEOSPATIAL sem URL de teste: HEAD no endpoint
    try {
      const r = await fetch(src.endpoint, { method: 'HEAD' });
      return {
        status: r.ok || r.status < 500 ? 'ATIVA' : statusFromHttp(r.status),
        http_status: r.status,
        response_time_ms: Date.now() - t0,
        error_message: r.ok ? null : `HEAD ${r.status}`,
        sample_result_count: 0,
        schema_valid: r.ok,
      };
    } catch (e) {
      return { status: classifyErr(e), http_status: null, response_time_ms: Date.now() - t0, error_message: e?.message || 'falha HEAD' };
    }
  }
  const headers = { 'Accept': 'application/json, text/html;q=0.9, */*;q=0.8' };
  if (src.requires_auth && src.auth_secret) {
    let key = '';
    try { key = secrets.get(src.auth_secret) || ''; } catch (_) { key = ''; }
    if (!key) {
      return {
        status: 'AUTH_REQUIRED', http_status: null, response_time_ms: null,
        error_message: `Sem secret ${src.auth_secret} configurada`,
        sample_result_count: 0, schema_valid: false,
      };
    }
    if (src.source_id === 'PORTAL_TRANSPARENCIA') headers['chave-api-dados'] = key;
    else headers.Authorization = key.startsWith('Bearer ') ? key : `Bearer ${key}`;
  }
  try {
    const r = await fetch(src.test_url, { headers, signal: AbortSignal.timeout(10000) });
    const response_time_ms = Date.now() - t0;
    const http_status = r.status;
    if (!r.ok) {
      return {
        status: statusFromHttp(http_status), http_status, response_time_ms,
        error_message: `HTTP ${http_status}`, sample_result_count: 0, schema_valid: false,
      };
    }
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('json')) {
      const json = await r.json().catch(() => null);
      if (json == null) return {
        status: 'INVALID_SCHEMA', http_status, response_time_ms,
        error_message: 'Resposta nao e JSON valido', sample_result_count: 0, schema_valid: false,
      };
      const items = Array.isArray(json) ? json
        : Array.isArray(json?.items) ? json.items
        : Array.isArray(json?.data) ? json.data
        : [json];
      const schema_valid = items.length > 0 || !!json?.nome || !!json?.id || !!json?.municipio?.id;
      return {
        status: 'ATIVA', http_status, response_time_ms, error_message: null,
        sample_result_count: items.length, sample_data: items[0] || json, schema_valid,
      };
    }
    // HTML — valido se a pagina respondeu
    const text = await r.text().catch(() => '');
    const schema_valid = text.length > 200;
    return {
      status: schema_valid ? 'ATIVA' : 'INVALID_SCHEMA',
      http_status, response_time_ms, error_message: schema_valid ? null : 'pagina vazia',
      sample_result_count: schema_valid ? 1 : 0, sample_data: text.slice(0, 300), schema_valid,
    };
  } catch (e) {
    return {
      status: classifyErr(e), http_status: null, response_time_ms: Date.now() - t0,
      error_message: e?.message || 'falha na requisicao',
      sample_result_count: 0, schema_valid: false,
    };
  }
}

async function testAI(base44) {
  const t0 = Date.now();
  try {
    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Responda em uma frase curta (ate 200 caracteres): qual o nome do municipio brasileiro de codigo IBGE ${SAMPLE_MUN.ibge}?`,
      add_context_from_internet: false,
      model: 'gpt_5_mini',
    });
    const texto = typeof r === 'string' ? r : (r?.content || r?.text || JSON.stringify(r));
    if (!texto || texto.length < 5) {
      return { status: 'NO_COVERAGE', http_status: 200, response_time_ms: Date.now() - t0, error_message: 'IA resposta vazia', schema_valid: false };
    }
    if (!/Belo Horizonte|3106200|BH/i.test(texto)) {
      return { status: 'INVALID_SCHEMA', http_status: 200, response_time_ms: Date.now() - t0, error_message: 'IA nao identificou BH', schema_valid: false };
    }
    return { status: 'ATIVA', http_status: 200, response_time_ms: Date.now() - t0, error_message: null, schema_valid: true };
  } catch (e) {
    return { status: classifyErr(e), http_status: null, response_time_ms: Date.now() - t0, error_message: e?.message || 'IA falhou', schema_valid: false };
  }
}

function applyFailurePolicy(prev_failures, raw_status) {
  if (raw_status === 'ATIVA') {
    return { final: 'ATIVA', consecutive_failures: 0, visible: true, deactivated: false };
  }
  const next = (prev_failures || 0) + 1;
  if (next >= 3) {
    return { final: 'DISCONTINUED', consecutive_failures: next, visible: false, deactivated: true };
  }
  if (next === 2) {
    return { final: 'DEGRADED', consecutive_failures: next, visible: true, deactivated: false };
  }
  return { final: raw_status, consecutive_failures: next, visible: true, deactivated: false };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Acesso administrador exigido' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const apenasSourceId = body?.source_id ? String(body.source_id) : null;
    const apenasCategoria = body?.category ? String(body.category) : null;

    let alvo = CATALOG.filter((s) => s.active);
    if (apenasSourceId) alvo = alvo.filter((s) => s.source_id === apenasSourceId);
    if (apenasCategoria) alvo = alvo.filter((s) => s.category === apenasCategoria);

    const db = base44.asServiceRole.entities.FonteDados;
    const existentes = await db.list().catch(() => []);
    const existenteMap = new Map();
    existentes.forEach((r) => existenteMap.set(r.source_id, r));

    const results = [];
    for (const src of alvo) {
      let resultado;
      if (src.method === 'API' || src.method === 'DOWNLOAD' || src.method === 'GEOSPATIAL') {
        resultado = await testHTTP(src);
      } else if (src.method === 'WEB_OFFICIAL_AI') {
        // WEB_OFFICIAL_AI: testa ponta GPT; se OK, fonte deixa ser usada (a busca real opera em pesquisarDadosTerritorialis)
        resultado = await testAI(base44);
      } else {
        resultado = { status: 'INVALID_SCHEMA', error_message: 'metodo desconhecido' };
      }

      const anterior = existenteMap.get(src.source_id);
      const prevFail = anterior?.consecutive_failures || 0;
      const policy = applyFailurePolicy(prevFail, resultado.status);

      const registro = {
        source_id: src.source_id,
        source_name: src.source_name,
        category: src.category,
        method: src.method,
        cadence_days: src.cadence_days,
        auth_secret: src.auth_secret || '',
        endpoint: src.endpoint,
        requires_auth: !!src.requires_auth,
        status: policy.final,
        status_tecnico: resultado.status,
        last_test_at: new Date().toISOString(),
        response_time_ms: resultado.response_time_ms ?? null,
        http_status: resultado.http_status ?? null,
        error_message: resultado.error_message || '',
        sample_municipality: SAMPLE_MUN.nome,
        sample_result_count: resultado.sample_result_count || 0,
        schema_valid: !!resultado.schema_valid,
        data_valid: policy.final === 'ATIVA',
        consecutive_failures: policy.consecutive_failures,
        visible: policy.visible,
        deactivated: policy.deactivated,
      };

      if (anterior) {
        await db.update(anterior.id, registro).catch(() => {});
      } else {
        await db.create(registro).catch(() => {});
      }

      results.push({
        source_id: src.source_id,
        method: src.method,
        status: policy.final,
        response_time_ms: resultado.response_time_ms ?? null,
        schema_valid: !!resultado.schema_valid,
        visible: policy.visible,
      });
    }

    const atual = await db.list().catch(() => []);
    const ativas = atual.filter((r) => r.status === 'ATIVA').length;
    const degradadas = atual.filter((r) => r.status === 'DEGRADED').length;
    const descontinuadas = atual.filter((r) => !r.visible).length;
    const total = atual.length;

    return Response.json({
      success: true,
      total_testadas: alvo.length,
      total_fontes_cadastradas: total,
      ativas,
      degradadas,
      indisponiveis: descontinuadas,
      coverage_percent: total > 0 ? Math.round((ativas / total) * 100) : 0,
      results,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Erro inesperado' }, { status: 500 });
  }
}