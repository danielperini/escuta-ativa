import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, FileText, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalisadorIAConteudo({ conteudo, onAnaliseCompleta }) {
  const [analisando, setAnalisando] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [tipoAnalise, setTipoAnalise] = useState('completa');

  const analisarConteudo = async (tipo) => {
    if (!conteudo || conteudo.length < 50) {
      toast.error('Conteúdo muito curto para análise');
      return;
    }

    setAnalisando(true);
    setTipoAnalise(tipo);

    try {
      let prompt = '';
      let schema = null;

      if (tipo === 'resumo') {
        prompt = `Analise este registro de interação comunitária e gere um resumo executivo conciso.

CONTEÚDO:
${conteudo}

Retorne um resumo objetivo destacando:
- Principais pontos discutidos
- Decisões tomadas
- Próximos passos`;
        
        const resultado = await base44.integrations.Core.InvokeLLM({ prompt });
        setAnalise({ tipo: 'resumo', conteudo: resultado });
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta({ resumo: resultado });
        }

      } else if (tipo === 'temas') {
        prompt = `Analise este registro e identifique os principais temas e assuntos discutidos.

CONTEÚDO:
${conteudo}

Identifique e categorize os temas em ordem de relevância.`;

        schema = {
          type: "object",
          properties: {
            temas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tema: { type: "string" },
                  relevancia: { type: "string", enum: ["alta", "media", "baixa"] },
                  mencoes: { type: "number" }
                }
              }
            }
          }
        };

        const resultado = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
        setAnalise({ tipo: 'temas', dados: resultado });
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta({ temas_identificados: resultado.temas?.map(t => t.tema) || [] });
        }

      } else if (tipo === 'riscos') {
        prompt = `Analise este registro e identifique potenciais riscos, alertas éticos e sinais de tensão social.

CONTEÚDO:
${conteudo}

Identifique riscos e classifique por gravidade.`;

        schema = {
          type: "object",
          properties: {
            riscos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  gravidade: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                  categoria: { type: "string" }
                }
              }
            },
            temperatura: { type: "string", enum: ["baixo", "medio", "alto", "critico"] }
          }
        };

        const resultado = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
        setAnalise({ tipo: 'riscos', dados: resultado });
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta({ 
            indicadores_risco: resultado.riscos?.map(r => r.descricao) || [],
            temperatura_territorio: resultado.temperatura 
          });
        }

      } else if (tipo === 'stakeholders') {
        prompt = `Analise este registro e identifique todos os stakeholders mencionados (pessoas, organizações, grupos).

CONTEÚDO:
${conteudo}

Liste todos os atores identificados.`;

        schema = {
          type: "object",
          properties: {
            stakeholders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string", enum: ["lideranca", "organizacao", "grupo", "morador", "governo"] },
                  papel: { type: "string" }
                }
              }
            }
          }
        };

        const resultado = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
        setAnalise({ tipo: 'stakeholders', dados: resultado });
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta({ participantes: resultado.stakeholders?.map(s => s.nome) || [] });
        }

      } else {
        // Análise completa
        prompt = `Analise este registro de forma completa e estruturada.

CONTEÚDO:
${conteudo}

Forneça uma análise detalhada incluindo:
- Resumo executivo
- Temas principais
- Participantes identificados
- Demandas e compromissos
- Riscos e alertas
- Próximos passos sugeridos`;

        schema = {
          type: "object",
          properties: {
            resumo: { type: "string" },
            temas: { type: "array", items: { type: "string" } },
            participantes: { type: "array", items: { type: "string" } },
            demandas: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  urgencia: { type: "string", enum: ["baixa", "media", "alta", "critica"] }
                }
              }
            },
            compromissos: { type: "array", items: { type: "string" } },
            indicadores_risco: { type: "array", items: { type: "string" } },
            temperatura: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
            proximos_passos: { type: "array", items: { type: "string" } }
          }
        };

        const resultado = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
        setAnalise({ tipo: 'completa', dados: resultado });
        
        if (onAnaliseCompleta) {
          onAnaliseCompleta(resultado);
        }
      }

      toast.success('Análise concluída!');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar conteúdo');
    } finally {
      setAnalisando(false);
    }
  };

  return (
    <Card className="border-2 border-purple-500">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Sparkles className="w-5 h-5" />
          Análise Inteligente por IA
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            onClick={() => analisarConteudo('resumo')}
            disabled={analisando || !conteudo}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <FileText className="w-6 h-6 mb-2 text-blue-600" />
            <span className="text-xs">Resumo Executivo</span>
          </Button>

          <Button
            onClick={() => analisarConteudo('temas')}
            disabled={analisando || !conteudo}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <TrendingUp className="w-6 h-6 mb-2 text-emerald-600" />
            <span className="text-xs">Identificar Temas</span>
          </Button>

          <Button
            onClick={() => analisarConteudo('riscos')}
            disabled={analisando || !conteudo}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <AlertTriangle className="w-6 h-6 mb-2 text-red-600" />
            <span className="text-xs">Detectar Riscos</span>
          </Button>

          <Button
            onClick={() => analisarConteudo('stakeholders')}
            disabled={analisando || !conteudo}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <Users className="w-6 h-6 mb-2 text-purple-600" />
            <span className="text-xs">Identificar Atores</span>
          </Button>

          <Button
            onClick={() => analisarConteudo('completa')}
            disabled={analisando || !conteudo}
            className="flex-col h-auto py-4 bg-purple-600 hover:bg-purple-700 col-span-2"
          >
            <Sparkles className="w-6 h-6 mb-2" />
            <span className="text-xs">Análise Completa</span>
          </Button>
        </div>

        {analisando && (
          <div className="flex items-center justify-center gap-2 p-4 bg-purple-50 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-sm text-purple-700">
              Analisando conteúdo com IA...
            </span>
          </div>
        )}

        {analise && (
          <div className="p-4 bg-slate-50 rounded-lg border-2 border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-purple-900">Resultado da Análise</h4>
              <Badge className="bg-purple-100 text-purple-700">
                {analise.tipo}
              </Badge>
            </div>

            {analise.tipo === 'resumo' && (
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{analise.conteudo}</p>
            )}

            {analise.tipo === 'temas' && analise.dados?.temas && (
              <div className="space-y-2">
                {analise.dados.temas.map((tema, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium">{tema.tema}</span>
                    <Badge variant="outline">{tema.relevancia}</Badge>
                  </div>
                ))}
              </div>
            )}

            {analise.tipo === 'riscos' && analise.dados?.riscos && (
              <div className="space-y-2">
                {analise.dados.riscos.map((risco, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-red-100 text-red-700">{risco.gravidade}</Badge>
                      <span className="text-xs text-slate-500">{risco.categoria}</span>
                    </div>
                    <p className="text-sm">{risco.descricao}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 rounded">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Temperatura: {analise.dados.temperatura}</span>
                </div>
              </div>
            )}

            {analise.tipo === 'stakeholders' && analise.dados?.stakeholders && (
              <div className="space-y-2">
                {analise.dados.stakeholders.map((sh, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <p className="text-sm font-medium">{sh.nome}</p>
                      <p className="text-xs text-slate-500">{sh.papel}</p>
                    </div>
                    <Badge variant="outline">{sh.tipo}</Badge>
                  </div>
                ))}
              </div>
            )}

            {analise.tipo === 'completa' && analise.dados && (
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-semibold mb-1">Resumo</h5>
                  <p className="text-sm text-slate-700">{analise.dados.resumo}</p>
                </div>
                
                {analise.dados.temas?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-1">Temas</h5>
                    <div className="flex flex-wrap gap-1">
                      {analise.dados.temas.map((t, i) => (
                        <Badge key={i} variant="secondary">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analise.dados.indicadores_risco?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-1 text-red-700">Riscos Identificados</h5>
                    <ul className="text-sm space-y-1">
                      {analise.dados.indicadores_risco.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-center text-slate-500">
          💡 A IA analisa o conteúdo transcrito e preenche campos automaticamente
        </p>
      </CardContent>
    </Card>
  );
}