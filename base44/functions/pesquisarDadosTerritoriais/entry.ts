import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// ===================================================================
// pesquisarDadosTerritoriais — Agente de pesquisa pública territorial.
// Usa InvokeLLM com acesso à internet (gemini_3_flash) para coletar
// dados públicos não disponíveis via API estruturada (prefeitos,
// secretarias, vereadores, conselhos, OSCs, programas sociais, etc.).
//Persiste resultado na entidade DadoSecundario (cache territorial).
// ===================================================================

const CATEGORIAS_PERMITIDAS = new Set([
  'resumo', 'demografia', 'fiscal', 'social', 'saude', 'educacao',
  'economia', 'cultura', 'esporte', 'saneamento', 'meio_ambiente',
  'mineracao', 'conselhos', 'osc', 'governo_municipal',
  'camara_municipal', 'legislacao', 'politicas_publicas'
]);

const TEMPLATE_PROMPT = (categoria, municipio, uf, ibge, fontes, perguntaExtra) =>
  `Você é um agente de pesquisa pública territorial para a plataforma societá.ai.
Sua tarefa é buscar, em fontes oficiais brasileiras, INDICADORES PÚBLICOS para o
município indicado e devolver um JSON estruturado com ${perguntaExtra ? 'a seguinte pergunta: ' + perguntaExtra : 'a categoria: ' + categoria}.

TERRITÓRIO:
- Município: ${municipio} (${uf}) — código IBGE: ${ibge}

FONTES PRIORITÁRIAS:
${(fontes || []).join(', ') || 'Todas as fontes oficiais brasileiras disponíveis'}

Priorize fontes oficiais/governamentais verificáveis:
prefeitura.municipal.gov.br, câmara municipal, Diário Oficial municipal/estadual,
dados.gov.br, portaldatransparencia.gov.br, IBGE/SIDRA, INEP, DATASUS/CNES,
Tesouro Nacional/SICONFI, Mapa das OSCs / IPEA, TSE, ANM, INPE, IBAMA, etc.

REGRAS OBRIGATÓRIAS:
1. NUNCA invente números, nomes, leis, ou datas. Se não houver informação pública verificável, retorne items vazios.
2. Cada item DEVE ter source_url rastreável (link real da fonte).
3. Não apresente CPF, NIS, dados médicos individuais — apenas dados agregados/territoriais.
4. Marque confidence como:
   - "oficial": fonte governamental verificada (IBGE, SICONFI, TSE, etc.)
   - "nao_verificado": encontrado via web, mas fonte não oficial ou não confirmada
   - "inferido_ia": derivado/cruzado pela IA
5. Distinga claramente FATO OFICIAL de INFERÊNCIA.
6. Para cargos/mandatos, informe o período (mandato) quando disponível. Não assuma composição antiga como vigente.
7. Resumo: fragmento curto (até 500 caracteres) sintetizando o perfil territorial.
8. Insights: lista de leituras da IA — sempre rotuladas como inferência.

Responda SOMENTE em JSON no schema solicitado.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const categoria = String(body?.categoria || 'resumo').trim();
    const municipio = String(body?.municipio || '').trim();
    const uf = String(body?.uf || '').trim();
    const ibge = String(body?.ibge_code || body?.ibge || '').trim();
    const fontes = Array.isArray(body?.fontes) ? body.fontes : [];
    const perguntaExtra = String(body?.pergunta || '').trim();
    // forcer: admin pode forçar nova coleta ignorando o cache de 30 dias
    const force_refresh = String(body?.force_refresh || '') === 'true' || body?.force_refresh === true;

    if (!municipio || !uf || !ibge) {
      return Response.json({ error: 'Informe municipio, uf e ibge_code.' }, { status: 400 });
    }
    if (!CATEGORIAS_PERMITIDAS.has(categoria)) {
      return Response.json({ error: 'Categoria não suportada.' }, { status: 400 });
    }

    // 1) Cache: tentar devolver último conjunto válido desta categoria/município
    let cache = [];
    try {
      cache = await base44.entities.DadoSecundario.filter({
        municipality_ibge_code: ibge,
        category: categoria
      }, '-updated_date', 60);
    } catch (_) { cache = []; }

    // Política determinística: uma vez por município+categoria, dados são
    // reutilizados por 30 dias. A única exceção é force_refresh=true (admin).
    const agora = Date.now();
    const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
    const FRESH = (cad) => {
      const upd = cad?.updated_at ? Date.parse(cad.updated_at) : 0;
      if (!upd) return false;
      return (agora - upd) < TRINTA_DIAS;
    };
    const todosFresh = !force_refresh && cache.length > 0 && cache.every(FRESH);
    if (todosFresh) {
      // Dados "revisados" — cache determinístico (uma vez ao mês).
      return Response.json({
        items: cache,
        resumo: cache.find(i => i.indicator === 'Resumo Executivo Territorial')?.value_text || '',
        insights: cache.filter(i => i.source_id === 'IA_INSIGHT').map(i => i.value_text),
        fresh: true,
        cache_window_days: 30,
        ultima_atualizacao: cache[0]?.updated_at
      });
    }

    // 2) Road research via IA (com internet)
    let resp;
    try {
      resp = await base44.integrations.Core.InvokeLLM({
        prompt: TEMPLATE_PROMPT(categoria, municipio, uf, ibge, fontes, perguntaExtra),
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  indicator: { type: 'string' },
                  value: { type: 'string' },
                  value_number: { type: 'number' },
                  unit: { type: 'string' },
                  reference_period: { type: 'string' },
                  source_url: { type: 'string' },
                  source_name: { type: 'string' },
                  orgao: { type: 'string' },
                  data_publicacao: { type: 'string' },
                  confidence: { type: 'string', enum: ['oficial', 'nao_verificado', 'inferido_ia'] },
                  observacao: { type: 'string' }
                }
              }
            },
            resumo: { type: 'string' },
            insights: { type: 'array', items: { type: 'string' } }
          }
        }
      });
    } catch (e) {
      // Limite de IA atingido ou erro — devolve cache (se houver) com aviso
      if (cache.length) {
        return Response.json({
          items: cache,
          resumo: 'Última análise armazenada em cache.',
          insights: [],
          fresh: false,
          ultima_atualizacao: cache[0]?.updated_at,
          warning: 'Não foi possível consultar a IA agora. Exibindo último dado válido.'
        });
      }
      return Response.json({
        error: 'Serviço de IA indisponível: ' + (e?.message || 'erro desconhecido') +
               '. Nenhum dado disponível em cache para este território/categoria.'
      }, { status: 503 });
    }

    const items = Array.isArray(resp?.items) ? resp.items : [];
    const resumo = String(resp?.resumo || '');
    const insights = Array.isArray(resp?.insights) ? resp.insights : [];

    const dataConsulta = new Date().toISOString();
    const registrosCache = [];

    // 3) Persistir itens como cache DadoSecundario
    for (const it of items) {
      if (!it?.indicator) continue;
      try {
        const criado = await base44.entities.DadoSecundario.create({
          source_id: `${categoria.toUpperCase()}_${it.indicator.replace(/\s+/g, '_').slice(0, 40)}_${ibge}`,
          source_name: it.source_name || categoria,
          municipality_ibge_code: ibge,
          municipality: municipio,
          state: uf,
          category: categoria,
          indicator: it.indicator,
          value_number: typeof it.value_number === 'number' ? it.value_number : (it.value ? Number(it.value.replace(/[^\d.-]/g, '')) || null : null),
          value_text: typeof it.value === 'string' ? it.value : (it.value_number != null ? String(it.value_number) : ''),
          unit: it.unit || '',
          reference_period: it.reference_period || '',
          source_url: it.source_url || '',
          orgao: it.orgao || '',
          collected_at: dataConsulta,
          updated_at: dataConsulta,
          confidence: it.confidence || 'nao_verificado',
          data_publicacao: it.data_publicacao || '',
          raw_metadata: { observacao: it.observacao || '' }
        });
        registrosCache.push(criado);
      } catch (_) { /* ignora duplicata ou erro de validação */ }
    }

    // Resumo como item especial
    if (resumo) {
      try {
        const r = await base44.entities.DadoSecundario.create({
          source_id: `RESUMO_${ibge}_${categoria}`,
          source_name: 'IA societá.ai (pesquisa web)',
          municipality_ibge_code: ibge,
          municipality: municipio,
          state: uf,
          category: categoria,
          indicator: 'Resumo Executivo Territorial',
          value_text: resumo,
          unit: '',
          collected_at: dataConsulta,
          updated_at: dataConsulta,
          confidence: 'inferido_ia',
          raw_metadata: {}
        });
        registrosCache.unshift(r);
      } catch (_) {}
    }

    // Insights como itens especiais
    for (let i = 0; i < insights.length; i++) {
      try {
        const r = await base44.entities.DadoSecundario.create({
          source_id: `IA_INSIGHT_${ibge}_${categoria}_${i}`,
          source_name: 'IA societá.ai (inferência)',
          municipality_ibge_code: ibge,
          municipality: municipio,
          state: uf,
          category: categoria,
          indicator: `Inferência da IA #${i + 1}`,
          value_text: String(insights[i] || ''),
          collected_at: dataConsulta,
          updated_at: dataConsulta,
          confidence: 'inferido_ia',
          raw_metadata: {}
        });
        registrosCache.push(r);
      } catch (_) {}
    }

    return Response.json({
      items: registrosCache.concat(items.map(it => ({
        indicator: it.indicator,
        value_text: typeof it.value === 'string' ? it.value : '',
        value_number: typeof it.value_number === 'number' ? it.value_number : null,
        unit: it.unit,
        reference_period: it.reference_period,
        source_url: it.source_url,
        source_name: it.source_name,
        orgao: it.orgao,
        confidence: it.confidence,
        municipality_ibge_code: ibge,
        municipality: municipio,
        state: uf,
        category: categoria
      }))),
      resumo,
      insights,
      fresh: false,
      ultima_atualizacao: dataConsulta
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Erro inesperado' }, { status: 500 });
  }
});