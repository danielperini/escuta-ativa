import { base44 } from '@/api/base44Client';

/**
 * Gerador inteligente de compromissos e devolutivas
 */
export async function gerarCompromissosInteligentes(textoConsolidado, analisePrevia = {}) {
  try {
    const prompt = `
Analise este texto e SUGIRA compromissos e devolutivas de forma inteligente.

TEXTO:
${textoConsolidado}

CONTEXTO DA ANÁLISE PRÉVIA:
- Sentimento detectado: ${analisePrevia.sentimento || 'não identificado'}
- Temas: ${(analisePrevia.temas || []).join(', ') || 'nenhum'}
- Temperatura: ${analisePrevia.temperatura || 'não identificada'}
- Demandas explícitas: ${(analisePrevia.demandas || []).join(', ') || 'nenhuma'}

REGRAS PARA SUGESTÃO DE COMPROMISSOS:
1. Compromissos devem ser REALISTAS e ESPECÍFICOS
2. Prazo deve considerar complexidade e urgência
3. Responsável deve ser sugerido com base no tipo de demanda
4. Prioridade baseada em: urgência da demanda + sentimento da comunidade + histórico

CRITÉRIOS DE URGÊNCIA:
- Urgente: demandas de segurança, saúde, conflitos iminentes
- Alta: demandas recorrentes, promessas anteriores não cumpridas
- Média: demandas estruturais com impacto moderado
- Baixa: sugestões de melhoria, demandas de longo prazo

CRITÉRIOS DE DEVOLUTIVA:
- Toda demanda explícita REQUER devolutiva obrigatória
- Prazo padrão: 15 dias úteis (ajustável por urgência)
- Devolutivas urgentes: 7 dias
- Devolutivas normais: 15 dias
- Devolutivas complexas: 30 dias

Para cada compromisso sugerido, forneça:
- Descrição clara e específica
- Responsável sugerido (ex: "Coordenação Socioambiental", "Gerência de Relacionamento")
- Prazo em dias
- Prioridade
- Tipo de ação
- Justificativa da sugestão
- Indicadores de sucesso

Para devolutivas obrigatórias, indique:
- Demanda original
- Prazo para devolutiva
- Formato sugerido (reunião/documento/comunicado)
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          compromissos_sugeridos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                descricao: { type: "string" },
                responsavel_sugerido: { type: "string" },
                prazo_dias: { type: "number" },
                prioridade: {
                  type: "string",
                  enum: ["baixa", "media", "alta", "urgente"]
                },
                tipo_acao: {
                  type: "string",
                  enum: ["devolutiva", "reuniao", "acao_concreta", "encaminhamento", "estudo"]
                },
                justificativa: { type: "string" },
                indicadores_sucesso: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          devolutivas_obrigatorias: {
            type: "array",
            items: {
              type: "object",
              properties: {
                demanda_original: { type: "string" },
                prazo_dias: { type: "number" },
                formato_sugerido: {
                  type: "string",
                  enum: ["reuniao", "documento_formal", "comunicado", "visita"]
                },
                pontos_abordar: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          recomendacoes_gerais: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return resultado;
  } catch (error) {
    console.error('Erro ao gerar compromissos inteligentes:', error);
    return { compromissos_sugeridos: [], devolutivas_obrigatorias: [] };
  }
}

/**
 * Cria compromissos automaticamente
 */
export async function criarCompromissos(compromissos, registroId, comunidade) {
  const compromissosIds = [];
  
  try {
    for (const comp of compromissos) {
      const prazo = new Date();
      prazo.setDate(prazo.getDate() + (comp.prazo_dias || 15));
      
      const compromissoId = await base44.entities.Compromisso.create({
        titulo: comp.descricao.substring(0, 100),
        descricao: comp.descricao,
        registro_origem_id: registroId,
        comunidade: comunidade,
        responsavel: comp.responsavel_sugerido || 'A definir',
        prazo: prazo.toISOString().split('T')[0],
        status: 'pendente',
        prioridade: comp.prioridade,
        observacoes: `Sugestão IA: ${comp.justificativa}`
      });
      
      compromissosIds.push(compromissoId);
    }
    
    return compromissosIds;
  } catch (error) {
    console.error('Erro ao criar compromissos:', error);
    return [];
  }
}