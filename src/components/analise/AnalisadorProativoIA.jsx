import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Target, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

export default function AnalisadorProativoIA() {
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState(null);

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-analise-ia'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-analise-ia'],
    queryFn: () => base44.entities.Caso.list()
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-analise-ia'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const realizarAnalise = async () => {
    setAnalisando(true);

    try {
      // Preparar contexto
      const registrosRecentes = registros.slice(0, 50).map(r => ({
        titulo: r.titulo,
        comunidade: r.comunidade,
        temas: r.temas_identificados,
        sentimento: r.sentimento,
        temperatura: r.temperatura_territorio,
        demandas: r.demandas?.length || 0
      }));

      const casosAtivos = casos.filter(c => c.status !== 'concluido' && c.status !== 'cancelado').map(c => ({
        titulo: c.titulo,
        tipo: c.tipo,
        status: c.status,
        comunidade: c.comunidade,
        prioridade: c.prioridade
      }));

      const stakeholdersChave = stakeholders.filter(s => 
        s.nivel_influencia === 'alto' || s.nivel_influencia === 'muito_alto'
      ).map(s => ({
        nome: s.nome,
        comunidade: s.comunidade,
        influencia: s.nivel_influencia,
        temas: s.temas_recorrentes
      }));

      const prompt = `Você é um analista sênior de engajamento comunitário. Analise os dados fornecidos e identifique:

**DADOS:**

Registros Recentes (${registrosRecentes.length}):
${JSON.stringify(registrosRecentes, null, 2)}

Casos em Andamento (${casosAtivos.length}):
${JSON.stringify(casosAtivos, null, 2)}

Stakeholders Chave (${stakeholdersChave.length}):
${JSON.stringify(stakeholdersChave, null, 2)}

**TAREFA:**
Realize uma análise proativa identificando:

1. **Padrões Emergentes**: Quais padrões você identifica nos dados? Há comunidades ou temas recorrentes?

2. **Potenciais Conflitos**: Baseado nos dados, onde você prevê que podem surgir conflitos ou tensões?

3. **Oportunidades de Colaboração**: Onde há oportunidades de conectar stakeholders ou comunidades para resolver problemas comuns?

4. **Ações Prioritárias**: Quais ações os analistas devem tomar IMEDIATAMENTE? Seja específico e prático.

5. **Stakeholders em Risco**: Há stakeholders que podem estar se afastando ou precisam de maior engajamento?

Seja objetivo, prático e baseado em evidências dos dados.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            padroes_emergentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  padrao: { type: "string" },
                  evidencias: { type: "array", items: { type: "string" } },
                  severidade: { type: "string", enum: ["baixa", "media", "alta"] }
                }
              }
            },
            potenciais_conflitos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  comunidades_afetadas: { type: "array", items: { type: "string" } },
                  probabilidade: { type: "string", enum: ["baixa", "media", "alta"] },
                  acoes_preventivas: { type: "array", items: { type: "string" } }
                }
              }
            },
            oportunidades_colaboracao: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  stakeholders_sugeridos: { type: "array", items: { type: "string" } },
                  beneficio_esperado: { type: "string" },
                  proximos_passos: { type: "array", items: { type: "string" } }
                }
              }
            },
            acoes_prioritarias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  justificativa: { type: "string" },
                  prazo: { type: "string" },
                  responsavel_sugerido: { type: "string" }
                }
              }
            },
            stakeholders_risco: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  motivo: { type: "string" },
                  acao_sugerida: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAnalise(resultado);
    } catch (error) {
      alert('Erro ao realizar análise: ' + error.message);
    } finally {
      setAnalisando(false);
    }
  };

  const getSeveridadeColor = (sev) => {
    return sev === 'alta' ? 'bg-red-100 text-red-700' : 
           sev === 'media' ? 'bg-yellow-100 text-yellow-700' : 
           'bg-green-100 text-green-700';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Análise Proativa com IA
            </CardTitle>
            <Button 
              onClick={realizarAnalise}
              disabled={analisando}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analisando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Realizar Análise
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              A IA analisa proativamente registros, casos e stakeholders para identificar padrões ocultos, 
              prever conflitos e sugerir oportunidades de colaboração.
            </p>
          </div>
        </CardContent>
      </Card>

      {analise && (
        <>
          {/* Padrões Emergentes */}
          {analise.padroes_emergentes && analise.padroes_emergentes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Padrões Emergentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analise.padroes_emergentes.map((padrao, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{padrao.padrao}</h4>
                      <Badge className={getSeveridadeColor(padrao.severidade)}>
                        {padrao.severidade}
                      </Badge>
                    </div>
                    <ul className="space-y-1 mt-2">
                      {padrao.evidencias.map((ev, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Potenciais Conflitos */}
          {analise.potenciais_conflitos && analise.potenciais_conflitos.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  Potenciais Conflitos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analise.potenciais_conflitos.map((conflito, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-red-900">{conflito.descricao}</h4>
                      <Badge variant="destructive">
                        Prob: {conflito.probabilidade}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800 mb-1">Comunidades Afetadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {conflito.comunidades_afetadas.map((com, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {com}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Ações Preventivas:</p>
                      <ul className="space-y-1">
                        {conflito.acoes_preventivas.map((acao, i) => (
                          <li key={i} className="text-sm text-red-700">✓ {acao}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Oportunidades de Colaboração */}
          {analise.oportunidades_colaboracao && analise.oportunidades_colaboracao.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Lightbulb className="w-5 h-5" />
                  Oportunidades de Colaboração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analise.oportunidades_colaboracao.map((oport, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">{oport.titulo}</h4>
                    <p className="text-sm text-green-800 mb-3">{oport.beneficio_esperado}</p>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Stakeholders Sugeridos:</p>
                      <div className="flex flex-wrap gap-1">
                        {oport.stakeholders_sugeridos.map((sh, i) => (
                          <Badge key={i} className="bg-green-200 text-green-800">
                            {sh}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">Próximos Passos:</p>
                      <ul className="space-y-1">
                        {oport.proximos_passos.map((passo, i) => (
                          <li key={i} className="text-sm text-green-700">{i + 1}. {passo}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Ações Prioritárias */}
          {analise.acoes_prioritarias && analise.acoes_prioritarias.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Target className="w-5 h-5" />
                  Ações Prioritárias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analise.acoes_prioritarias.map((acao, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-amber-900">{acao.acao}</h4>
                      <Badge className="bg-amber-200 text-amber-800">
                        {acao.prazo}
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-800 mb-2">{acao.justificativa}</p>
                    <p className="text-xs text-amber-700">
                      <strong>Responsável sugerido:</strong> {acao.responsavel_sugerido}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Stakeholders em Risco */}
          {analise.stakeholders_risco && analise.stakeholders_risco.length > 0 && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <AlertTriangle className="w-5 h-5" />
                  Stakeholders em Risco
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analise.stakeholders_risco.map((sh, idx) => (
                  <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-1">{sh.nome}</h4>
                    <p className="text-sm text-purple-800 mb-2"><strong>Motivo:</strong> {sh.motivo}</p>
                    <p className="text-sm text-purple-700">
                      <strong>Ação Sugerida:</strong> {sh.acao_sugerida}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}