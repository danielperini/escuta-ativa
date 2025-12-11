import { base44 } from '@/api/base44Client';

/**
 * Análise avançada de riscos sociais com ações mitigadoras
 */
export async function analisarRiscosSociais(textoConsolidado, contexto = {}) {
  try {
    const prompt = `
Analise PROFUNDAMENTE este texto de registro comunitário e identifique riscos sociais com ações mitigadoras.

TEXTO:
${textoConsolidado}

CONTEXTO ADICIONAL:
- Comunidade: ${contexto.comunidade || 'Não informada'}
- Local: ${contexto.local || 'Não informado'}
- Participantes: ${(contexto.participantes || []).join(', ') || 'Não informado'}
- Histórico da comunidade: ${contexto.historico || 'Primeira interação'}

IMPORTANTE: Seja preciso e baseie-se APENAS no conteúdo do texto. Não invente riscos.

CRITÉRIOS DE IDENTIFICAÇÃO DE RISCOS:
1. Linguagem tensa ou confrontacional
2. Menções a protestos, mobilizações, paralisações
3. Descumprimento de compromissos anteriores
4. Frustração com falta de devolutivas
5. Demandas urgentes não atendidas
6. Conflitos entre grupos
7. Ameaças de ações jurídicas
8. Deterioração de relacionamento
9. Aumento de tensão social
10. Situações de vulnerabilidade social

Para cada risco identificado, forneça:
- Título do risco
- Nível (baixo/moderado/alto/critico)
- Tipo (protesto/fechamento_via/paralisacao/desgaste_politico/tensao_comunitaria/nao_cumprimento_compromisso/mobilizacao_social)
- Descrição detalhada
- Causas identificadas
- Indicadores que levaram a essa classificação
- Previsão de agravamento (baixa/media/alta)
- Ações preventivas específicas e práticas
- Atores envolvidos
- Prazo sugerido para ação

Se não houver riscos reais, retorne array vazio.
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          riscos_identificados: {
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
                  enum: ["protesto", "fechamento_via", "paralisacao", "desgaste_politico", 
                         "tensao_comunitaria", "nao_cumprimento_compromisso", "mobilizacao_social"]
                },
                descricao: { type: "string" },
                causas: {
                  type: "array",
                  items: { type: "string" }
                },
                indicadores: {
                  type: "array",
                  items: { type: "string" }
                },
                previsao_agravamento: {
                  type: "string",
                  enum: ["baixa", "media", "alta"]
                },
                acoes_preventivas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      acao: { type: "string" },
                      responsavel_sugerido: { type: "string" },
                      prazo_sugerido: { type: "string" },
                      prioridade: {
                        type: "string",
                        enum: ["baixa", "media", "alta", "urgente"]
                      }
                    }
                  }
                },
                atores_envolvidos: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          temperatura_geral: {
            type: "string",
            enum: ["baixo", "medio", "alto", "critico"]
          },
          justificativa_temperatura: { type: "string" }
        }
      }
    });

    return resultado;
  } catch (error) {
    console.error('Erro na análise de riscos:', error);
    return { riscos_identificados: [], temperatura_geral: 'baixo' };
  }
}

/**
 * Cria registros de riscos sociais automaticamente
 */
export async function criarRiscosSociais(riscos, registroId, comunidade, localizacao) {
  const riscosIds = [];
  
  try {
    for (const risco of riscos) {
      const riscoId = await base44.entities.RiscoSocial.create({
        titulo: risco.titulo,
        nivel: risco.nivel,
        tipo: risco.tipo,
        descricao: risco.descricao,
        comunidade: comunidade,
        causas: risco.causas,
        geolocalizacao: localizacao,
        registros_associados: [registroId],
        liderancas_envolvidas: [],
        previsao_agravamento: risco.previsao_agravamento,
        acoes_preventivas: risco.acoes_preventivas.map(a => a.acao),
        status: 'ativo'
      });
      
      riscosIds.push(riscoId);
    }
    
    return riscosIds;
  } catch (error) {
    console.error('Erro ao criar riscos sociais:', error);
    return [];
  }
}