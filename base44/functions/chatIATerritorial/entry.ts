import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

const SYSTEM_PROMPT = `Você é o Chat IA da societá.ai, especializado em relacionamento comunitário, inteligência social e territorial.

Princípios permanentes:
- Responda prioritariamente com base nos DADOS INTERNOS e DADOS PÚBLICOS fornecidos no contexto abaixo.
- Nunca invente informações (nomes próprios, cargos, números, datas, citações, projetos de lei, comunidades, OSCs, hospital, escola, contatos).
- Diferencie claramente: DADO INTERNO (registro societá.ai), DADO OFICIAL (fonte pública), INFORMAÇÃO WEB, PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO/RECLAMAÇÃO, INFERÊNCIA DA IA, HIPÓTESE PARA INVESTIGAÇÃO.
- Quando usar dados públicos, informe fonte, período e território. Não misture indicadores de anos diferentes sem avisar.
- Para números, indique: indicador, valor, unidade, período, território e fonte.
- Correlação não significa causalidade. Nunca transforme coincidência em causa.
- Não repasse dados pessoais (CPF, NIS, dados médicos individuais, senhas, tokens). Aplique minimização.
- Se o usuário disser "aqui" sem especificar território, use os TOTAIS visíveis no banco (ex: total de comunidades cadastradas) e, se a pergunta exigir detalhamento municipal, pergunte qual território consultar.
- Se faltar evidência suficiente, responda explicitamente: "Não encontrei dados suficientes nas fontes disponíveis para responder com segurança." e sugira qual fonte consultar.

Estrutura da resposta (Markdown):
- ## Resposta — síntese objetiva
- ## Evidências internas — registros societá.ai (cite o id como [REG-xxx])
- ## Dados públicos — indicadores de fontes externas (cite fonte e período)
- ## Leitura da IA — interpretação/síntese claramente marcada como inferência
- ## Fontes — links e referências
Mostre apenas seções com conteúdo. Em tabelas, indique sempre indicador/valor/unidade/período/fonte.`;

function safeArr(arr, n) {
  return Array.isArray(arr) ? arr.slice(0, n) : [];
}

const TERMOS_HIDRICOS = /água|falta\s+d.?água|abasteci|poço|nascente|rio|córrego|qualidade\s+da\s+água|seca|enchente|inundação|captação|esgoto|odor|contaminação|vazão|cisterna|poço\s+artesiano/i;
const TERMOS_TELECOM = /internet|sinal|conectividade|telefone|celular|wi-?fi|fibra|rede|3g|4g|5g|operadora|cobertura\s+mov/i;

function resumoRegistro(r) {
  const desc = (r.descricao || '').replace(/\s+/g, ' ').slice(0, 200);
  return `- [REG-${r.id?.slice(-6) || 'XXXXXX'}] ${r.titulo || 'Sem título'} (${r.data_registro || (r.created_date || '').slice(0, 10) || ''})${desc ? ': ' + desc + ((r.descricao || '').length > 200 ? '…' : '') : ''}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const pergunta = (body.pergunta || '').toString().trim();
    if (!pergunta) return Response.json({ error: 'Pergunta vazia' }, { status: 400 });
    const municipio = (body.municipio || '').toString().trim();
    const uf = (body.uf || '').toString().trim();
    const ibge = (body.ibge || '').toString().trim();
    const contextoPagina = (body.contextoPagina || '').toString().trim();
    const historico = safeArr(body.historico, 8);

    const contexto = [];
    const fontesInternas = [];
    const fontesPublicas = [];
    const munLower = municipio.toLowerCase();
    const perguntaLower = pergunta.toLowerCase();
    const perguntaHidrica = TERMOS_HIDRICOS.test(pergunta);
    const perguntaTelecom = TERMOS_TELECOM.test(pergunta);

    // === FASE 1: Comunidades (TOTais sempre; detalhe municipal quando aplicável) ===
    try {
      const comAll = await base44.entities.Comunidade.list('-updated_date', 100);
      const munComs = munLower
        ? comAll.filter((c) => (c.municipio || '').toLowerCase().includes(munLower))
        : comAll;
      const amostra = munComs.slice(0, 30);
      const totalTxt = munLower
        ? `${munComs.length} comunidades em ${municipio} (de ${comAll.length} cadastradas no app)`
        : `${comAll.length} comunidades cadastradas no total do app`;
      contexto.push(`COMUNIDADES CADASTRADAS NA SOCIETÁ.AI (TOTAL ${totalTxt}):\n${amostra.length ? amostra.map((c) => `- ${c.nome} (município: ${c.municipio || 'n/d'}${c.estado ? '/' + c.estado : ''}, tipo: ${c.tipo || 'n/d'}, termômetro: ${c.termometro_social || 'n/d'})`).join('\n') : '—'}`);
      amostra.slice(0, 5).forEach((c) => fontesInternas.push({ id: c.id, titulo: c.nome, tipo: 'comunidade' }));
    } catch (e) { /* ignore */ }

    // === FASE 2: Stakeholders ===
    try {
      const stkAll = await base44.entities.Stakeholder.list('-updated_date', 50);
      const filtered = munLower
        ? stkAll.filter((s) => (s.municipio || '').toLowerCase().includes(munLower))
        : stkAll;
      const amostra = filtered.slice(0, 20);
      const totalTxt = munLower
        ? `${filtered.length} stakeholders em ${municipio} (de ${stkAll.length} no app)`
        : `${stkAll.length} stakeholders cadastrados no total`;
      contexto.push(`STAKEHOLDERS CADASTRADOS (TOTAL ${totalTxt}):\n${amostra.length ? amostra.map((s) => `- ${s.nome} (${s.subtipo || s.tipo || 'n/d'}; município: ${s.municipio || 'n/d'}; nível influência: ${s.nivel_influencia || 'n/d'})`).join('\n') : '—'}`);
      amostra.slice(0, 5).forEach((s) => fontesInternas.push({ id: s.id, titulo: s.nome, tipo: 'stakeholder' }));
    } catch (e) { /* ignore */ }

    // === FASE 3: Registros recentes (com priorização quando pergunta envolve água/telecomunicações) ===
    try {
      const regAll = await base44.entities.Registro.list('-created_date', 60);
      const filteredPorMun = munLower
        ? regAll.filter((r) =>
            (r.comunidade || '').toLowerCase().includes(munLower) ||
            (r.localizacao?.municipio || '').toLowerCase().includes(munLower))
        : regAll;
      let amostra = filteredPorMun.slice(0, 12);
      const totalTxt = munLower
        ? `${filteredPorMun.length} registros vinculados a ${municipio}`
        : `${regAll.length} registros recentes (literatura geral do app)`;
      if (perguntaHidrica) {
        const hidro = filteredPorMun.filter((r) =>
          TERMOS_HIDRICOS.test((r.descricao || '') + ' ' + (r.transcricao || '') + ' ' + (r.temas_identificados || []).join(' '))
        );
        if (hidro.length) {
          amostra = hidro.slice(0, 12);
          amostra.forEach((r) => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro sobre água', tipo: 'registro' }));
          contexto.push(`REGISTROS INTERNOS RELACIONADOS A ÁGUA/RECURSOS HÍDRICOS (${hidro.length} encontrados):\n${amostra.map(resumoRegistro).join('\n')}`);
        }
      }
      if (perguntaTelecom) {
        const tel = filteredPorMun.filter((r) =>
          TERMOS_TELECOM.test((r.descricao || '') + ' ' + (r.transcricao || '') + ' ' + (r.temas_identificados || []).join(' '))
        );
        if (tel.length) {
          contexto.push(`REGISTROS INTERNOS RELACIONADOS A TELECOMUNICAÇÕES/INTERNET (${tel.length} encontrados):\n${tel.slice(0, 12).map(resumoRegistro).join('\n')}`);
          tel.slice(0, 6).forEach((r) => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro sobre conectividade', tipo: 'registro' }));
        }
      }
      contexto.push(`REGISTROS INTERNOS RECENTES DA SOCIETÁ.AI (TOTAL ${totalTxt}; ${Math.min(12, amostra.length)} resumidos):\n${amostra.length ? amostra.map(resumoRegistro).join('\n') : '—'}`);
      // Garantir fontes internas com registros recentes (caso filtro temático não tenha casado)
      if (fontesInternas.filter((f) => f.tipo === 'registro').length === 0) {
        amostra.slice(0, 4).forEach((r) => fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro', tipo: 'registro' }));
      }
    } catch (e) { /* ignore */ }

    // === FASE 4: Riscos sociais ativos ===
    try {
      const risc = await base44.entities.RiscoSocial.list('-created_date', 30);
      if (risc.length) {
        const amostra = risc.slice(0, 10);
        contexto.push(`RISCOS SOCIAIS CADASTRADOS (${risc.length} no app; 10 amostrados):\n${amostra.map((r) => `- ${r.titulo || r.nome || ('Risco')}${r.nivel || r.severidade ? ' (' + (r.nivel || r.severidade) + ')' : ''}`).join('\n')}`);
      }
    } catch (e) { /* ignore */ }

    // === FASE 5: Compromissos ativos ===
    try {
      const comp = await base44.entities.Compromisso.list('-prazo', 30);
      if (comp.length) {
        const amostra = comp.slice(0, 10);
        contexto.push(`COMPROMISSOS CADASTRADOS (${comp.length} no app; 10 amostrados):\n${amostra.map((c) => `- ${c.titulo || 'Compromisso'}${c.prazo ? ' (até ' + c.prazo.slice(0, 10) + ')' : ''}${c.status ? ' — ' + c.status : ''}`).join('\n')}`);
      }
    } catch (e) { /* ignore */ }

    // === FASE 6: Dados Secundários ===
    if (munLower) {
      try {
        const dados = await base44.entities.DadoSecundario.filter({ municipality: municipio }, '-updated_date', 40);
        if (dados.length) {
          const resumos = dados.slice(0, 25).map((d) => {
            const v = d.value_number != null ? `${d.value_number}${d.unit ? ' ' + d.unit : ''}` : (d.value_text || '');
            return `- ${d.indicator}: ${v}${d.reference_period ? ' (' + d.reference_period + ')' : ''}${d.source_name ? ' — ' + d.source_name : ''}`;
          }).join('\n');
          contexto.push(`DADOS SECUNDÁRIOS (${dados.length} indicadores disponíveis para ${municipio}; 25 resumidos):\n${resumos}`);
          const vistos = new Set();
          dados.forEach((d) => {
            if (d.source_url && !vistos.has(d.source_url)) {
              vistos.add(d.source_url);
              fontesPublicas.push({ fonte: d.source_name || d.orgao || 'Fonte pública', url: d.source_url, referencia: d.reference_period || '' });
            }
          });
        }
      } catch (e) { /* ignore */ }
    } else {
      try {
        const dadosAll = await base44.entities.DadoSecundario.list('-updated_date', 100);
        if (dadosAll.length) {
          contexto.push(`DADOS SECUNDÁRIOS CADASTRADOS NA PLATAFORMA (TOTAL: ${dadosAll.length} indicadores para ${new Set(dadosAll.map((d) => d.municipality).filter(Boolean)).size} municípios; categorias presentes: ${Array.from(new Set(dadosAll.map((d) => d.category).filter(Boolean))).join(', ')}).\n15 mais recentes:\n${dadosAll.slice(0, 15).map((d) => `- ${d.indicator} (${d.municipality || 'n/d'}${d.reference_period ? ', ' + d.reference_period : ''}) — ${d.source_name || ''}`).join('\n')}`);
        }
      } catch (e) { /* ignore */ }
    }

    // === FASE 7: Contexto agregado com página + território (+ dicas) ===
    const terrTxt = municipio
      ? `${municipio}${uf ? '/' + uf : ''}${ibge ? ' (IBGE ' + ibge + ')' : ''}`
      : 'NÃO ESPECIFICADO — se "aqui", responda usando os TOTAIS visíveis no banco (ex: "existem N comunidades cadastradas no app") e pergunte o território apenas se a pergunta exigir detalhamento municipal';

    const dicaContextual = perguntaHidrica
      ? '\n\nNOTA: o usuário perguntou sobre ÁGUA. Cruze registros internos (percepção/alegação) com Dados Secundários ANATEL/ANA, se disponíveis. Diferencie percepção comunitária (registro) de dado oficial (fonte pública).'
      : perguntaTelecom
        ? '\n\nNOTA: o usuário perguntou sobre TELECOMUNICAÇÕES. Cruze registros internos com Dados Secundários ANATEL, se disponíveis. Diferencie presença da operadora de cobertura geográfica e experiência relatada.'
        : '';

    const contextoBloco = `CONTEXTO DO TERRITÓRIO: ${terrTxt}.
PÁGINA ATUAL NA PLATAFORMA: ${contextoPagina || 'não identificada'}.

DADOS INTERNOS COLETADOS (use estes como fonte primária; nunca invente dados; se faltar, declare insuficiência):
${contexto.join('\n\n')}
${dicaContextual}

PERGUNTA: ${pergunta}`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: contextoBloco },
    ];

    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.25,
    });

    return Response.json({
      resposta: completion.choices[0].message.content,
      fontesInternas: safeArr(fontesInternas, 10),
      fontesPublicas: safeArr(fontesPublicas, 10),
      territorio: municipio ? `${municipio}${uf ? '/' + uf : ''}` : null,
    });
  } catch (err) {
    return Response.json({ error: err.message || 'Erro no Chat IA' }, { status: 500 });
  }
}