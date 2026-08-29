import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';
import { classificarRelacionamentoViaIA, montarClassificacaoIA } from '../../shared/relationshipClassification.ts';

// ===================================================================
// analisarNovoRegistro — Automação da tela "Novo Registro" da societá.ai.
// Recebe o texto consolidado (transcrição/OCR/digitado) da tela de Novo
// Registro + comunidade mencionada (opcional) e devolve, em UMA chamada
// da API GPT (OpenAI), a análise estruturada completa que preenche
// automaticamente os campos do formulário: identificação, temas, demandas,
// compromissos, stakeholders, riscos, materialidade, agenda futura e
// próximos passos.
//
// Equivalente a `processarRegistroCompleto` anterior, mas usa a API GPT
// diretamente (OPENAI_API_KEY configurada no app) — sem InvokeLLM.
// ===================================================================

const SYSTEM_PROMPT = `Você é um sistema de análise territorial para a societá.ai — Plataforma de relacionamento comunitário.
Você recebe o texto de uma interação comunitária (reunião, conversa de campo, visita técnica, demanda espontânea ou atividade comunitária) e devolve SOMENTE um JSON estruturado que preencherá automaticamente os campos do registro.

Princípios:
- NÃO invente informações. Se algo não estiver explícito ou claramente implícito no texto, marque como null ou retorne lista vazia.
- Identifique TODOS os nomes mencionados, mesmo incompletos ("Dona Maria", "Sr. João").
- Diferencie FATO (registrado), PERCEPÇÃO COMUNITÁRIA, ALEGAÇÃO e INFERÊNCIA IA.
- O município deve ser inferido do contexto ou explicitamente mencionado. Se não houver pista, devolva null.
- Datas relativas ("próxima semana", "em 30 dias") devem ser convertidas para YYYY-MM-DD considerando o dia de hoje.
- A análise deve ser objetiva e acionável para a equipe de relacionamento comunitário.

Schema de saída (preencha SOMENTE esses campos — ignore qualquer outro):
{
  "identificacao": {
    "titulo": "string (até 80 caracteres)",
    "tipo": "reuniao | conversa_campo | visita | demanda | ocorrencia",
    "comunidade": "string ou null",
    "municipio": "string ou null",
    "local": "string ou null",
    "resumo": "string (máx 200 palavras)"
  },
  "analise": {
    "temas": ["string"],
    "sentimento": "positivo | neutro | negativo | misto",
    "temperatura": "baixo | medio | alto | critico",
    "participantes": ["string"]
  },
  "demandas": [
    { "descricao": "string", "urgencia": "baixa | media | alta | critica", "requer_devolutiva": true, "prazo_sugerido": "YYYY-MM-DD ou texto curto" }
  ],
  "compromissos": [
    { "descricao": "string", "responsavel": "string ou null", "prazo": "YYYY-MM-DD ou null", "prioridade": "baixa | media | alta | urgente" }
  ],
  "stakeholders": [
    {
      "nome": "string",
      "tipo": "pessoa | entidade",
      "papel_social": "string ou null",
      "organizacao": "string ou null",
      "municipio": "string ou null",
      "contato_telefone": "string ou null",
      "contato_email": "string ou null"
    }
  ],
  "riscos": [
    {
      "titulo": "string",
      "nivel": "baixo | moderado | alto | critico",
      "tipo": "string (ex: tensao_comunitaria)",
      "causas": ["string"],
      "acoes_preventivas": ["string"]
    }
  ],
  "materialidade": {
    "temas_comunidade": ["string"],
    "temas_empresa": ["string"],
    "relevancia_comunidade": 1-10,
    "relevancia_empresa": 1-10,
    "divergencias": ["string"]
  },
  "localizacao": { "lat": "number ou null", "lng": "number ou null", "endereco": "string ou null" },
  "agenda_futura": [ { "titulo": "string", "data": "YYYY-MM-DD ou null", "tipo": "reuniao | visita | outro" } ],
  "proximos_passos": ["string"]
}

Retorne SOMENTE o JSON (sem texto extra, sem markdown).`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const textoConsolidado = String(body?.textoConsolidado || '').trim();
    const comunidade = String(body?.comunidade || '').trim();

    if (!textoConsolidado) {
      return Response.json({ error: 'Texto consolidado vazio.' }, { status: 400 });
    }

    // Trunca texto muito longo — proteção de tokens
    const textoLimit = textoConsolidado.slice(0, 14000);

    const userContent = `TEXTO DO REGISTRO:
${textoLimit}

COMUNIDADE MENCIONADA: ${comunidade || 'não especificada'}

TAREFA: Extraia TODAS as informações relevantes em UMA ÚNICA análise, seguindo EXATAMENTE o schema informado. Não inclua campos extras. Não invente dados.`;

    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let resultado;
    try {
      resultado = JSON.parse(raw);
    } catch (parseErr) {
      return Response.json({
        error: 'A IA não retornou JSON válido.',
        raw,
      }, { status: 502 });
    }

    // Classificação do tipo de relacionamento (Comunitário/Institucional/ambos).
    // Analisa conjuntamente título, descrição, tipo, território, participantes,
    // temas, demandas e a transcrição original.
    let relationshipFields: any = null;
    try {
      const contextoRegistro = {
        titulo: resultado.identificacao?.titulo || '',
        tipo: resultado.identificacao?.tipo || '',
        descricao: resultado.identificacao?.resumo || textoLimit,
        comunidade: resultado.identificacao?.comunidade || comunidade || '',
        localizacao: { municipio: resultado.identificacao?.municipio || '', estado: '' },
        participantes: resultado.analise?.participantes || [],
        temas_identificados: resultado.analise?.temas || [],
        demandas: resultado.demandas || [],
        transcricao: textoLimit,
      };
      const classificacao = await classificarRelacionamentoViaIA(openai, contextoRegistro);
      relationshipFields = montarClassificacaoIA(classificacao, 'ia');
    } catch (classErr) {
      // Falha na classificação não deve derrubar a análise principal.
      console.error('Erro ao classificar relacionamento:', classErr?.message);
    }

    return Response.json({
      ...resultado,
      ...relationshipFields,
      // Mantém compatibilidade com os campos esperados pelo frontend
      // (caso a IA omita alguma seção, garante que existam)
      identificacao: resultado.identificacao || { titulo: '', tipo: 'conversa_campo', resumo: '' },
      analise: resultado.analise || { temas: [], participantes: [] },
      demandas: Array.isArray(resultado.demandas) ? resultado.demandas : [],
      compromissos: Array.isArray(resultado.compromissos) ? resultado.compromissos : [],
      stakeholders: Array.isArray(resultado.stakeholders) ? resultado.stakeholders : [],
      riscos: Array.isArray(resultado.riscos) ? resultado.riscos : [],
      materialidade: resultado.materialidade || { temas_comunidade: [], temas_empresa: [] },
      localizacao: resultado.localizacao || {},
      agenda_futura: Array.isArray(resultado.agenda_futura) ? resultado.agenda_futura : [],
      proximos_passos: Array.isArray(resultado.proximos_passos) ? resultado.proximos_passos : [],
    });
  } catch (err) {
    return Response.json({ error: err?.message || 'Erro ao analisar registro.' }, { status: 500 });
  }
}