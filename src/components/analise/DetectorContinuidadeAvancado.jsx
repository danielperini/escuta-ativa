import { base44 } from '@/api/base44Client';

/**
 * Detector de continuidade avançado com análise de similaridade
 */
export async function detectarContinuidadeInteligente(novoRegistro, registrosHistoricos) {
  try {
    const prompt = `
Analise se este NOVO REGISTRO é continuidade de algum registro anterior usando análise de similaridade profunda.

NOVO REGISTRO:
${JSON.stringify({
  titulo: novoRegistro.titulo,
  tipo: novoRegistro.tipo,
  comunidade: novoRegistro.comunidade,
  local: novoRegistro.local,
  descricao: novoRegistro.descricao,
  temas: novoRegistro.temas_identificados,
  participantes: novoRegistro.participantes,
  demandas: novoRegistro.demandas
}, null, 2)}

REGISTROS HISTÓRICOS (últimos 50):
${JSON.stringify(registrosHistoricos.map(r => ({
  id: r.id,
  titulo: r.titulo,
  tipo: r.tipo,
  comunidade: r.comunidade,
  local: r.local,
  data: r.created_date,
  temas: r.temas_identificados,
  participantes: r.participantes,
  demandas: r.demandas?.map(d => d.descricao),
  compromissos: r.compromissos?.map(c => c.descricao)
})), null, 2)}

CRITÉRIOS DE ANÁLISE DE CONTINUIDADE (pontuação de 0-100):

1. SIMILARIDADE TEMÁTICA (peso: 30%)
   - Temas idênticos: +30 pontos
   - Temas correlatos: +15 pontos
   - Temas diferentes: 0 pontos

2. MESMOS ATORES (peso: 25%)
   - Mesmas lideranças/participantes: +25 pontos
   - Alguns atores em comum: +12 pontos
   - Nenhum ator comum: 0 pontos

3. MESMA LOCALIZAÇÃO (peso: 15%)
   - Mesma comunidade E local: +15 pontos
   - Mesma comunidade: +8 pontos
   - Locais diferentes: 0 pontos

4. CONTINUIDADE DE DEMANDA (peso: 20%)
   - Mesma demanda recorrente: +20 pontos
   - Demanda relacionada: +10 pontos
   - Demandas diferentes: 0 pontos

5. DEVOLUTIVA PENDENTE (peso: 10%)
   - Devolutiva não realizada: +10 pontos
   - Compromisso pendente: +5 pontos

6. PROXIMIDADE TEMPORAL (peso adicional)
   - Menos de 7 dias: +5 pontos bonus
   - Menos de 30 dias: +3 pontos bonus
   - Menos de 90 dias: +1 ponto bonus

CLASSIFICAÇÃO FINAL:
- 70-100 pontos: muito_alto (continuidade clara)
- 50-69 pontos: alto (provável continuidade)
- 30-49 pontos: medio (possível continuidade)
- 0-29 pontos: baixo (improvável)

IMPORTANTE:
- Seja rigoroso: vincular registros errados causa confusão
- Explique detalhadamente o motivo da pontuação
- Liste elementos comuns específicos
- Considere contexto temporal e evolução da demanda

Para cada continuidade detectada (score >= 30), retorne:
- ID do registro anterior
- Score de similaridade (0-100)
- Grau de relação
- Elementos em comum detalhados
- Motivo da continuidade
- Recomendação de vinculação
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          continuidades_detectadas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                registro_id: { type: "string" },
                titulo_registro: { type: "string" },
                data_registro: { type: "string" },
                score_similaridade: { type: "number" },
                grau_relacao: {
                  type: "string",
                  enum: ["muito_alto", "alto", "medio", "baixo"]
                },
                elementos_comuns: {
                  type: "object",
                  properties: {
                    temas_comuns: { type: "array", items: { type: "string" } },
                    atores_comuns: { type: "array", items: { type: "string" } },
                    demandas_relacionadas: { type: "array", items: { type: "string" } },
                    compromissos_pendentes: { type: "array", items: { type: "string" } }
                  }
                },
                analise_detalhada: { type: "string" },
                motivo_continuidade: { type: "string" },
                recomendacao: {
                  type: "string",
                  enum: ["vincular_fortemente", "vincular_opcionalmente", "apenas_mencionar", "nao_vincular"]
                }
              }
            }
          },
          justificativa_geral: { type: "string" },
          caso_novo: { type: "boolean" }
        }
      }
    });

    return resultado;
  } catch (error) {
    console.error('Erro ao detectar continuidade:', error);
    return { continuidades_detectadas: [], caso_novo: true };
  }
}