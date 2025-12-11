import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function DetectorRiscos() {
    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-riscos'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 50),
        refetchInterval: 600000 // 10 minutos
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-riscos'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-riscos'],
        queryFn: () => base44.entities.Agenda.list()
    });

    useEffect(() => {
        const detectarRiscos = async () => {
            try {
                // Preparar contexto para IA
                const ultimasAtividades = atividades.slice(0, 20).map(a => ({
                    descricao: a.descricao?.substring(0, 300),
                    temas: a.temas_identificados,
                    demandas: a.demandas,
                    compromissos: a.compromissos,
                    alertas_eticos: a.alertas_eticos,
                    comunidade: a.local,
                    data: a.data
                }));

                const compromissosAtrasados = compromissos.filter(c => c.status === "atrasado");
                const agendasEmAtraso = agendas.filter(a => a.status === "em_atraso");

                const contexto = `
ANÁLISE DE RISCOS SOCIAIS - ÚLTIMAS ATIVIDADES

Atividades Recentes: ${ultimasAtividades.length}
Compromissos Atrasados: ${compromissosAtrasados.length}
Reuniões em Atraso: ${agendasEmAtraso.length}

DADOS DETALHADOS:
${JSON.stringify({ ultimasAtividades, compromissosAtrasados: compromissosAtrasados.slice(0, 10), agendasEmAtraso: agendasEmAtraso.slice(0, 10) }, null, 2)}

CRITÉRIOS DE RISCO:
1. Protestos mencionados ou mobilizações sociais
2. Fechamento de vias ou paralisações
3. Tensões comunitárias crescentes
4. Não cumprimento de compromissos importantes
5. Desgaste político ou conflitos
6. Demandas urgentes não atendidas
7. Alertas éticos críticos

Identifique novos riscos sociais que ainda não foram catalogados.
`;

                const analiseIA = await base44.integrations.Core.InvokeLLM({
                    prompt: contexto,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            riscos_detectados: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        titulo: { type: "string" },
                                        nivel: { 
                                            type: "string",
                                            enum: ["baixo", "moderado", "alto", "critico"]
                                        },
                                        tipo: { 
                                            type: "string",
                                            enum: ["protesto", "fechamento_via", "paralisacao", "desgaste_politico", "tensao_comunitaria", "nao_cumprimento_compromisso", "mobilizacao_social"]
                                        },
                                        descricao: { type: "string" },
                                        comunidade: { type: "string" },
                                        causas: { 
                                            type: "array", 
                                            items: { type: "string" } 
                                        },
                                        previsao_agravamento: { 
                                            type: "string",
                                            enum: ["baixa", "media", "alta"]
                                        },
                                        acoes_preventivas: { 
                                            type: "array", 
                                            items: { type: "string" } 
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                // Criar riscos detectados
                if (analiseIA.riscos_detectados && analiseIA.riscos_detectados.length > 0) {
                    const riscosExistentes = await base44.entities.RiscoSocial.list();

                    for (const risco of analiseIA.riscos_detectados) {
                        // Verificar se já existe risco similar
                        const jaExiste = riscosExistentes.some(r => 
                            r.titulo === risco.titulo && 
                            r.comunidade === risco.comunidade &&
                            r.status === "ativo"
                        );

                        if (!jaExiste && risco.nivel && risco.tipo && risco.comunidade) {
                            // Verificar feedbacks anteriores para melhorar detecção
                            const feedbacks = await base44.entities.FeedbackIA.list();
                            const feedbacksRisco = feedbacks.filter(f => f.tipo_analise === "risco_social");
                            
                            // Criar novo risco
                            const novoRisco = await base44.entities.RiscoSocial.create({
                                titulo: risco.titulo,
                                nivel: risco.nivel,
                                tipo: risco.tipo,
                                descricao: risco.descricao,
                                comunidade: risco.comunidade,
                                causas: risco.causas || [],
                                previsao_agravamento: risco.previsao_agravamento || "media",
                                acoes_preventivas: risco.acoes_preventivas || [],
                                status: "ativo",
                                registros_associados: atividades.slice(0, 5).filter(a => 
                                    a.local === risco.comunidade
                                ).map(a => a.id)
                            });

                            // Criar notificação
                            await base44.entities.Notificacao.create({
                                tipo: "alerta_etico",
                                titulo: `🚨 Novo Risco Social Detectado: ${risco.nivel}`,
                                mensagem: `A IA identificou um risco social ${risco.nivel} na comunidade ${risco.comunidade}: ${risco.titulo}. Avalie e tome ações preventivas.`,
                                prioridade: risco.nivel === "critico" ? "alta" : risco.nivel === "alto" ? "alta" : "media",
                                entidade_relacionada_tipo: "RiscoSocial",
                                entidade_relacionada_id: novoRisco.id
                            });
                        }
                    }
                }

            } catch (error) {
                console.error("Erro ao detectar riscos:", error);
            }
        };

        if (atividades.length > 0) {
            detectarRiscos();
        }
    }, [atividades, compromissos, agendas]);

    return null;
}