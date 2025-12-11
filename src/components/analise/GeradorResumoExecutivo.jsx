import { base44 } from '@/api/base44Client';

/**
 * Gerador de resumos executivos e atas estruturadas
 */
export async function gerarResumoExecutivo(textoConsolidado, metadados = {}) {
  try {
    const prompt = `
Gere um RESUMO EXECUTIVO profissional e estruturado deste registro comunitário.

TEXTO COMPLETO:
${textoConsolidado}

METADADOS:
- Título: ${metadados.titulo}
- Tipo: ${metadados.tipo}
- Data: ${metadados.data}
- Local: ${metadados.local}
- Comunidade: ${metadados.comunidade}
- Participantes: ${(metadados.participantes || []).join(', ')}

O RESUMO EXECUTIVO DEVE CONTER:

1. SÍNTESE (máx 200 palavras)
   - Objetivo do encontro/registro
   - Principais pontos discutidos
   - Resultado geral

2. PARTICIPANTES E REPRESENTAÇÕES
   - Quem participou
   - Que grupos/instituições representam
   - Nível de engajamento

3. TEMAS ABORDADOS (em ordem de relevância)
   - Tema principal
   - Temas secundários
   - Contexto de cada tema

4. DEMANDAS REGISTRADAS
   - Demandas explícitas da comunidade
   - Grau de urgência
   - Justificativas apresentadas

5. COMPROMISSOS ASSUMIDOS
   - Por quem
   - Prazo
   - Natureza do compromisso

6. PONTOS DE ATENÇÃO
   - Tensões identificadas
   - Riscos potenciais
   - Oportunidades

7. PRÓXIMOS PASSOS
   - Ações imediatas
   - Encaminhamentos
   - Próximas reuniões/encontros

8. CLIMA/SENTIMENTO GERAL
   - Atmosfera do encontro
   - Nível de satisfação
   - Expectativas da comunidade

Seja OBJETIVO, CLARO e FACTUAL. Use linguagem profissional adequada para relatórios corporativos.
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          sintese: { type: "string" },
          participantes_detalhados: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                representacao: { type: "string" },
                papel: { type: "string" }
              }
            }
          },
          temas_abordados: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tema: { type: "string" },
                relevancia: {
                  type: "string",
                  enum: ["principal", "secundario", "mencionado"]
                },
                contexto: { type: "string" }
              }
            }
          },
          demandas_registradas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                descricao: { type: "string" },
                urgencia: {
                  type: "string",
                  enum: ["baixa", "media", "alta", "critica"]
                },
                justificativa: { type: "string" }
              }
            }
          },
          compromissos_assumidos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                descricao: { type: "string" },
                responsavel: { type: "string" },
                prazo: { type: "string" },
                natureza: { type: "string" }
              }
            }
          },
          pontos_atencao: {
            type: "array",
            items: { type: "string" }
          },
          proximos_passos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                acao: { type: "string" },
                responsavel: { type: "string" },
                prazo: { type: "string" }
              }
            }
          },
          clima_geral: {
            type: "object",
            properties: {
              atmosfera: {
                type: "string",
                enum: ["muito_positiva", "positiva", "neutra", "tensa", "conflituosa"]
              },
              nivel_satisfacao: {
                type: "string",
                enum: ["alto", "medio", "baixo"]
              },
              expectativas: { type: "string" }
            }
          }
        }
      }
    });

    return resultado;
  } catch (error) {
    console.error('Erro ao gerar resumo executivo:', error);
    return null;
  }
}

/**
 * Gerador de ata de reunião formal
 */
export async function gerarAtaReuniao(textoConsolidado, metadados = {}) {
  try {
    const prompt = `
Gere uma ATA DE REUNIÃO formal e completa seguindo padrões profissionais.

TEXTO DA REUNIÃO:
${textoConsolidado}

METADADOS:
- Data: ${metadados.data}
- Horário: ${metadados.horario || 'Não informado'}
- Local: ${metadados.local}
- Participantes: ${(metadados.participantes || []).join(', ')}

ESTRUTURA DA ATA:

CABEÇALHO:
- Título da reunião
- Data, hora e local
- Participantes presentes

PAUTA:
- Pontos da agenda (se identificáveis)

DESENVOLVIMENTO:
- Discussões em ordem cronológica
- Posicionamentos de cada parte
- Decisões tomadas

DELIBERAÇÕES:
- Resoluções aprovadas
- Compromissos assumidos com responsáveis e prazos

PENDÊNCIAS:
- Assuntos não resolvidos
- Encaminhamentos necessários

PRÓXIMA REUNIÃO:
- Data sugerida
- Pauta preliminar

Use linguagem formal, terceira pessoa, verbos no passado.
Seja completo mas conciso.
`;

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          cabecalho: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              data: { type: "string" },
              horario: { type: "string" },
              local: { type: "string" },
              participantes: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          pauta: {
            type: "array",
            items: { type: "string" }
          },
          desenvolvimento: { type: "string" },
          deliberacoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                deliberacao: { type: "string" },
                responsavel: { type: "string" },
                prazo: { type: "string" }
              }
            }
          },
          pendencias: {
            type: "array",
            items: { type: "string" }
          },
          proxima_reuniao: {
            type: "object",
            properties: {
              data_sugerida: { type: "string" },
              pauta_preliminar: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          texto_completo_ata: { type: "string" }
        }
      }
    });

    return resultado;
  } catch (error) {
    console.error('Erro ao gerar ata:', error);
    return null;
  }
}