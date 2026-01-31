import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { file, context = {} } = await req.json();

        // 1) Upload do arquivo
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        const file_url = uploadResult.file_url;

        // 2) Buscar contexto do app (registros recentes, parâmetros, etc)
        const registrosRecentes = await base44.asServiceRole.entities.Registro.list('-created_date', 20);
        const comunidades = await base44.asServiceRole.entities.Comunidade.list();
        const stakeholders = await base44.asServiceRole.entities.Stakeholder.list('-updated_date', 50);

        const existing_records_summary = registrosRecentes.map(r => ({
            id: r.id,
            titulo: r.titulo,
            data_registro: r.data_registro,
            comunidade: r.comunidade,
            participantes: r.participantes || [],
            temas_identificados: r.temas_identificados || []
        }));

        const app_parameters = {
            territorios: comunidades.map(c => c.nome),
            tipos_registro: ["reuniao", "conversa_campo", "visita", "demanda", "ocorrencia"],
            tipos_demanda: ["Informação", "Reclamação", "Solicitação", "Denúncia", "Sugestão", "Elogio", "Conflito"],
            categorias_esg: [
                "direitos_humanos", "participacao_social", "dialogo_comunitario",
                "construcao_conjunta", "desenvolvimento_local", "governanca_social",
                "gestao_impactos", "cultura_identidade"
            ],
            niveis_temperatura: ["baixo", "medio", "alto", "critico"],
            niveis_risco: ["baixo", "medio", "alto", "critico"]
        };

        // 3) Chamada principal do Claude - Extração estruturada
        const promptExtracao = `
Você é um motor de extração e estruturação de registros do app Escuta Ativa.
Sua saída DEVE ser JSON válido, sem markdown, sem comentários, sem texto extra.

CONTEXTO DO APP:
- Usuário atual: ${user.full_name} (${user.email})
- Parâmetros: ${JSON.stringify(app_parameters)}
- Registros recentes: ${JSON.stringify(existing_records_summary)}
- Contexto adicional: ${JSON.stringify(context)}

INSTRUÇÕES:
1. Se o arquivo for PDF/Imagem: use leitura visual/OCR para capturar tabelas, campos, carimbos e textos
2. Se for Áudio/Vídeo: transcreva e use a transcrição como base
3. Preencha automaticamente todos os campos possíveis
4. Para cada campo, informe confidence (0 a 1) e source (trecho/resumo)
5. Se algum campo obrigatório não estiver presente, retorne em missing_fields
6. Detecte duplicidade comparando com existing_records_summary

SAÍDA OBRIGATÓRIA (JSON):
{
  "registro": {
    "tipo": {"value": "", "confidence": 0, "source": ""},
    "titulo": {"value": "", "confidence": 0, "source": ""},
    "data_registro": {"value": "", "confidence": 0, "source": ""},
    "local": {"value": "", "confidence": 0, "source": ""},
    "comunidade": {"value": "", "confidence": 0, "source": ""},
    "descricao": {"value": "", "confidence": 0, "source": ""},
    "temperatura_territorio": {"value": "", "confidence": 0, "source": ""},
    "sentimento": {"value": "", "confidence": 0, "source": ""}
  },
  "participantes": [
    {"nome": "", "papel": "", "organizacao": "", "contato": "", "confidence": 0, "source": ""}
  ],
  "temas_identificados": [
    {"tema": "", "confidence": 0, "source": ""}
  ],
  "demandas": [
    {"descricao": "", "urgencia": "", "tipo_demanda": "", "confidence": 0, "source": ""}
  ],
  "compromissos": [
    {"descricao": "", "responsavel": "", "prazo": "", "confidence": 0, "source": ""}
  ],
  "transcricao": {
    "texto": "",
    "confidence": 0
  },
  "missing_fields": [
    {"campo": "", "pergunta_para_usuario": "", "motivo": ""}
  ],
  "possible_duplicates": [
    {"record_id": "", "motivo": "", "confidence": 0}
  ]
}
`;

        const extractionResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: promptExtracao,
            file_urls: [file_url],
            response_json_schema: {
                type: "object",
                properties: {
                    registro: { type: "object" },
                    participantes: { type: "array" },
                    temas_identificados: { type: "array" },
                    demandas: { type: "array" },
                    compromissos: { type: "array" },
                    transcricao: { type: "object" },
                    missing_fields: { type: "array" },
                    possible_duplicates: { type: "array" }
                }
            }
        });

        // 4) Criar o registro estruturado
        const registroData = {
            titulo: extractionResult.registro?.titulo?.value || "Registro processado por IA",
            tipo: extractionResult.registro?.tipo?.value || "conversa_campo",
            data_registro: extractionResult.registro?.data_registro?.value || new Date().toISOString().split('T')[0],
            local: extractionResult.registro?.local?.value,
            comunidade: extractionResult.registro?.comunidade?.value,
            descricao: extractionResult.registro?.descricao?.value,
            transcricao: extractionResult.transcricao?.texto,
            temperatura_territorio: extractionResult.registro?.temperatura_territorio?.value,
            sentimento: extractionResult.registro?.sentimento?.value,
            participantes: extractionResult.participantes?.map(p => p.nome).filter(Boolean) || [],
            temas_identificados: extractionResult.temas_identificados?.map(t => t.tema).filter(Boolean) || [],
            demandas: extractionResult.demandas?.map(d => ({
                descricao: d.descricao,
                urgencia: d.urgencia || "media",
                tipo_demanda: d.tipo_demanda,
                status: "pendente"
            })) || [],
            compromissos: extractionResult.compromissos?.map(c => ({
                descricao: c.descricao,
                responsavel: c.responsavel,
                prazo: c.prazo,
                status: "pendente"
            })) || [],
            arquivos: [{
                url: file_url,
                tipo: "documento",
                nome: context.filename || "arquivo_processado"
            }],
            preenchimento_automatico: {
                origem: "Claude IA",
                timestamp: new Date().toISOString(),
                confidence_media: extractionResult.registro ? 
                    Object.values(extractionResult.registro)
                        .filter(v => v.confidence !== undefined)
                        .reduce((acc, v) => acc + v.confidence, 0) / 
                    Object.values(extractionResult.registro).length : 0
            },
            status: extractionResult.missing_fields?.length > 0 ? "rascunho" : "finalizado"
        };

        const novoRegistro = await base44.asServiceRole.entities.Registro.create(registroData);

        // 5) Criar stakeholders detectados (se não existirem)
        const stakeholdersParaCriar = [];
        for (const participante of extractionResult.participantes || []) {
            if (!participante.nome) continue;
            
            const existente = stakeholders.find(s => 
                s.nome.toLowerCase().includes(participante.nome.toLowerCase())
            );

            if (!existente && registroData.comunidade) {
                stakeholdersParaCriar.push({
                    nome: participante.nome,
                    tipo: "pessoa",
                    comunidade: registroData.comunidade,
                    municipio: context.municipio || "A definir",
                    organizacao: participante.organizacao,
                    papel_social: participante.papel,
                    primeira_mencao: new Date().toISOString(),
                    registro_origem: novoRegistro.id,
                    registros_vinculados: [novoRegistro.id]
                });
            }
        }

        if (stakeholdersParaCriar.length > 0) {
            await base44.asServiceRole.entities.Stakeholder.bulkCreate(stakeholdersParaCriar);
        }

        // 6) Segunda chamada - Análise de insights
        const promptAnalise = `
Com base no registro processado e nos parâmetros do app Escuta Ativa, gere:

REGISTRO PROCESSADO:
${JSON.stringify(extractionResult, null, 2)}

REGISTROS RECENTES PARA COMPARAÇÃO:
${JSON.stringify(existing_records_summary, null, 2)}

GERE (em JSON):
{
  "alertas": [{"tipo": "", "gravidade": "baixa|media|alta|critica", "justificativa": "", "evidencias": []}],
  "tendencias": [{"tema": "", "direcao": "subindo|estavel|caindo", "justificativa": ""}],
  "recomendacoes": [{"acao": "", "prioridade": "baixa|media|alta|critica", "por_que": ""}],
  "perguntas_proxima_interacao": [{"pergunta": "", "objetivo": ""}],
  "temperatura_sugerida": {"value": "baixa|media|alta|critica", "justificativa": ""}
}
`;

        const insightsResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: promptAnalise,
            response_json_schema: {
                type: "object",
                properties: {
                    alertas: { type: "array" },
                    tendencias: { type: "array" },
                    recomendacoes: { type: "array" },
                    perguntas_proxima_interacao: { type: "array" },
                    temperatura_sugerida: { type: "object" }
                }
            }
        });

        // 7) Criar notificações para alertas críticos
        const alertasCriticos = insightsResult.alertas?.filter(a => 
            a.gravidade === "alta" || a.gravidade === "critica"
        ) || [];

        for (const alerta of alertasCriticos) {
            await base44.asServiceRole.entities.Notificacao.create({
                tipo: "alerta_etico",
                titulo: `⚠️ ${alerta.tipo}`,
                mensagem: alerta.justificativa,
                prioridade: alerta.gravidade === "critica" ? "alta" : "media",
                entidade_relacionada_tipo: "Registro",
                entidade_relacionada_id: novoRegistro.id
            });
        }

        return Response.json({
            success: true,
            registro_id: novoRegistro.id,
            registro: novoRegistro,
            extraction: extractionResult,
            insights: insightsResult,
            missing_fields: extractionResult.missing_fields || [],
            possible_duplicates: extractionResult.possible_duplicates || [],
            stakeholders_created: stakeholdersParaCriar.length,
            alertas_criticos: alertasCriticos.length
        });

    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});