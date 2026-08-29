import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

const SYSTEM_PROMPT = `Você é o Chat IA da societá.ai, especializado em relacionamento comunitário, inteligência social e territorial.

Princípios permanentes:
- Responda prioritariamente com base nos DADOS INTERNOS e DADOS PÚBLICOS fornecidos no contexto.
- Nunca invente informações (nomes próprios, cargos, números, datas, citações, projetos de lei, comunidades, OSCs, hospital, escola, contatos).
- Diferencie claramente: DADO INTERNO (registro societá.ai), DADO OFICIAL (fonte pública), INFORMAÇÃO WEB, PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO/RECLAMAÇÃO, INFERÊNCIA DA IA, HIPÓTESE PARA INVESTIGAÇÃO.
- Quando usar dados públicos, informe fonte, período e território. Não misture indicadores de anos diferentes sem avisar.
- Para números, indique: indicador, valor, unidade, período, território e fonte.
- Correlação não significa causalidade. Nunca transforme coincidência em causa.
- Não repasse dados pessoais (CPF, NIS, dados médicos individuais, senhas, tokens). Aplique minimização.
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

    if (munLower) {
      // 1. Registros internos (somente do município selecionado)
      try {
        const regs = await base44.entities.Registro.list('-created_date', 50);
        const municipiosMatch = regs.filter((r) =>
          (r.comunidade || '').toLowerCase().includes(munLower) ||
          (r.localizacao?.municipio || '').toLowerCase().includes(munLower)
        );
        if (municipiosMatch.length) {
          const resumos = municipiosMatch.slice(0, 12).map((r) => {
            const desc = (r.descricao || '').replace(/\s+/g, ' ').slice(0, 200);
            return `- [REG-${r.id?.slice(-6) || 'XXXXXX'}] ${r.titulo || 'Sem título'} (${r.data_registro || (r.created_date || '').slice(0, 10) || ''})${desc ? ': ' + desc + ((r.descricao || '').length > 200 ? '…' : '') : ''}`;
          }).join('\n');
          contexto.push(`REGISTROS INTERNOS DA SOCIETÁ.AI (${municipiosMatch.length} encontrados para ${municipio}; ${Math.min(12, municipiosMatch.length)} resumidos):\n${resumos}`);
          municipiosMatch.slice(0, 6).forEach((r) =>
            fontesInternas.push({ id: r.id, titulo: r.titulo || 'Registro', tipo: 'registro' })
          );
        }
      } catch (e) { /* ignore */ }

      // 2. Dados Secundários coletados para este município
      try {
        const dados = await base44.entities.DadoSecundario.filter({ municipality: municipio }, '-updated_date', 40);
        if (dados.length) {
          const resumos = dados.slice(0, 25).map((d) => {
            const v = d.value_number != null
              ? `${d.value_number}${d.unit ? ' ' + d.unit : ''}`
              : (d.value_text || '');
            return `- ${d.indicator}: ${v}${d.reference_period ? ' (' + d.reference_period + ')' : ''}${d.source_name ? ' — ' + d.source_name : ''}`;
          }).join('\n');
          contexto.push(`DADOS SECUNDÁRIOS (${dados.length} indicadores disponíveis para ${municipio}; 25 resumidos):\n${resumos}`);
          const vistos = new Set();
          dados.forEach((d) => {
            if (d.source_url && !vistos.has(d.source_url)) {
              vistos.add(d.source_url);
              fontesPublicas.push({
                fonte: d.source_name || d.orgao || 'Fonte pública',
                url: d.source_url,
                referencia: d.reference_period || '',
              });
            }
          });
        }
      } catch (e) { /* ignore */ }

      // 3. Comunidades cadastradas
      try {
        const coms = await base44.entities.Comunidade.list('-updated_date', 50);
        const municipiosMatch = coms.filter((c) =>
          (c.municipio || '').toLowerCase().includes(munLower)
        );
        if (municipiosMatch.length) {
          contexto.push(`COMUNIDADES CADASTRADAS (${municipiosMatch.length}):\n${municipiosMatch.slice(0, 10).map((c) =>
            `- ${c.nome} (tipo: ${c.tipo || 'n/d'}; principais temas: ${(c.principais_temas || []).slice(0, 5).join(', ') || 'n/d'}; termômetro: ${c.termometro_social || 'n/d'})`
          ).join('\n')}`);
          municipiosMatch.slice(0, 5).forEach((c) =>
            fontesInternas.push({ id: c.id, titulo: c.nome, tipo: 'comunidade' })
          );
        }
      } catch (e) { /* ignore */ }

      // 4. Stakeholders do município
      try {
        const stks = await base44.entities.Stakeholder.list('-updated_date', 50);
        const municipiosMatch = stks.filter((s) =>
          (s.municipio || '').toLowerCase().includes(munLower)
        );
        if (municipiosMatch.length) {
          contexto.push(`STAKEHOLDERS (${municipiosMatch.length}):\n${municipiosMatch.slice(0, 10).map((s) =>
            `- ${s.nome} (${s.subtipo || s.tipo || 'n/d'}; nível influência: ${s.nivel_influencia || 'n/d'}${
              s.papel_social ? '; papel: ' + s.papel_social : ''
            })`
          ).join('\n')}`);
          municipiosMatch.slice(0, 5).forEach((s) =>
            fontesInternas.push({ id: s.id, titulo: s.nome, tipo: 'stakeholder' })
          );
        }
      } catch (e) { /* ignore */ }
    }

    const contextoBloco = contexto.length
      ? `CONTEXTO DO TERRITÓRIO: ${municipio}${uf ? '/' + uf : ''}${ibge ? ' (IBGE ' + ibge + ')' : ''}.
PÁGINA ATUAL NA PLATAFORMA: ${contextoPagina || 'não identificada'}.

DADOS INTERNOS COLETADOS (use estes como fonte primária; nunca invente dados; se faltar, declare insuficiência):
${contexto.join('\n\n')}

PERGUNTA: ${pergunta}`
      : `CONTEXTO DO TERRITÓRIO: ${municipio || 'NÃO ESPECIFICADO — se a pergunta envolver território específico, pergunte ao usuário qual município/comunidade consultar'}.
PÁGINA ATUAL: ${contextoPagina || 'não identificada'}.

DADOS INTERNOS COLETADOS: nenhum disponível para este território (ou nenhum território informado).

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