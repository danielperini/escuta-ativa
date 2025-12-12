import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle, AlertTriangle, Target, Users, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { analisarRiscosSociais } from '@/components/analise/AnalisadorRiscosAvancado';
import { gerarCompromissosInteligentes } from '@/components/analise/GeradorCompromissosInteligente';
import { detectarContinuidadeInteligente } from '@/components/analise/DetectorContinuidadeAvancado';

export default function AnalisadorTempoReal({ textoConsolidado, formData, onSugestoesGeradas }) {
  const [analisando, setAnalisando] = useState(false);
  const [analiseCompleta, setAnaliseCompleta] = useState(null);
  const [riscos, setRiscos] = useState(null);
  const [compromissos, setCompromissos] = useState(null);
  const [continuidade, setContinuidade] = useState(null);

  useEffect(() => {
    if (textoConsolidado && textoConsolidado.length > 50) {
      const timer = setTimeout(() => {
        analisarAutomaticamente();
      }, 2000); // Debounce de 2 segundos

      return () => clearTimeout(timer);
    }
  }, [textoConsolidado]);

  const analisarAutomaticamente = async () => {
    setAnalisando(true);
    
    try {
      // ANÁLISE BÁSICA
      const prompt = `
Analise este texto de registro comunitário e extraia informações estruturadas:

TEXTO:
${textoConsolidado}

Extraia:
1. Temas principais (máx 5)
2. Participantes/atores mencionados
3. Demandas explícitas
4. Compromissos assumidos
5. Sentimento predominante
6. Temperatura do território
7. Localização específica mencionada
8. Título sugerido
9. Tipo de atividade

Seja preciso. Base-se APENAS no texto.
`;

      const analiseBasica = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            temas_identificados: { type: "array", items: { type: "string" } },
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
            compromissos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  responsavel: { type: "string" }
                }
              }
            },
            sentimento: { type: "string", enum: ["positivo", "neutro", "negativo", "misto"] },
            temperatura_territorio: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
            local_especifico: { type: "string" },
            titulo_sugerido: { type: "string" },
            tipo_sugerido: { type: "string" }
          }
        }
      });

      setAnaliseCompleta(analiseBasica);

      // ANÁLISES AVANÇADAS EM PARALELO
      const [analiseRiscos, analiseCompromissos, registrosHistoricos] = await Promise.all([
        analisarRiscosSociais(textoConsolidado, {
          comunidade: formData.comunidade,
          local: formData.local,
          participantes: analiseBasica.participantes
        }),
        gerarCompromissosInteligentes(textoConsolidado, {
          sentimento: analiseBasica.sentimento,
          temas: analiseBasica.temas_identificados,
          temperatura: analiseBasica.temperatura_territorio,
          demandas: analiseBasica.demandas
        }),
        base44.entities.Registro.list('-created_date', 50)
      ]);

      setRiscos(analiseRiscos);
      setCompromissos(analiseCompromissos);

      // Detecção de continuidade
      if (formData.comunidade) {
        const resultadoContinuidade = await detectarContinuidadeInteligente(
          { ...formData, ...analiseBasica },
          registrosHistoricos
        );
        setContinuidade(resultadoContinuidade);
      }

      // Enviar sugestões para o componente pai
      onSugestoesGeradas({
        analise_basica: analiseBasica,
        riscos: analiseRiscos,
        compromissos_ia: analiseCompromissos,
        continuidade: resultadoContinuidade
      });

    } catch (error) {
      console.error('Erro na análise automática:', error);
    } finally {
      setAnalisando(false);
    }
  };

  if (!textoConsolidado || textoConsolidado.length < 50) {
    return null;
  }

  return (
    <div className="space-y-4">
      {analisando && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Analisando com IA...</p>
                <p className="text-xs text-blue-700">Identificando temas, atores, riscos e compromissos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analiseCompleta && !analisando && (
        <>
          {/* Resumo da Análise */}
          <Card className="border-2 border-emerald-500 bg-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <CheckCircle className="w-5 h-5" />
                Análise IA Concluída
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-slate-500">Temas</p>
                  <p className="font-bold text-lg">{analiseCompleta.temas_identificados?.length || 0}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-slate-500">Demandas</p>
                  <p className="font-bold text-lg">{analiseCompleta.demandas?.length || 0}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-slate-500">Compromissos</p>
                  <p className="font-bold text-lg">{analiseCompleta.compromissos?.length || 0}</p>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-slate-500">Temperatura</p>
                  <Badge className={
                    analiseCompleta.temperatura_territorio === 'critico' ? 'bg-red-600' :
                    analiseCompleta.temperatura_territorio === 'alto' ? 'bg-orange-600' :
                    analiseCompleta.temperatura_territorio === 'medio' ? 'bg-amber-600' : 'bg-emerald-600'
                  }>
                    {analiseCompleta.temperatura_territorio || 'baixo'}
                  </Badge>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={analisarAutomaticamente}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Reanalisar
              </Button>
            </CardContent>
          </Card>

          {/* Riscos Detectados */}
          {riscos?.riscos_identificados?.length > 0 && (
            <Card className="border-l-4 border-red-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  {riscos.riscos_identificados.length} Risco(s) Social(is) Detectado(s)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {riscos.riscos_identificados.map((risco, idx) => (
                  <div key={idx} className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-red-900">{risco.titulo}</h4>
                      <Badge className={
                        risco.nivel === 'critico' ? 'bg-red-700' :
                        risco.nivel === 'alto' ? 'bg-orange-600' :
                        risco.nivel === 'moderado' ? 'bg-amber-600' : 'bg-blue-600'
                      }>
                        {risco.nivel}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-800 mb-2">{risco.descricao}</p>
                    {risco.acoes_preventivas?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-emerald-700">Ações Sugeridas:</p>
                        <ul className="text-xs text-emerald-800 list-disc list-inside">
                          {risco.acoes_preventivas.slice(0, 2).map((acao, i) => (
                            <li key={i}>{acao.acao} (Prazo: {acao.prazo_sugerido})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compromissos Inteligentes Sugeridos */}
          {compromissos?.compromissos_sugeridos?.length > 0 && (
            <Card className="border-l-4 border-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Target className="w-5 h-5" />
                  Compromissos Sugeridos pela IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {compromissos.compromissos_sugeridos.slice(0, 3).map((comp, idx) => (
                  <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-blue-900">{comp.descricao}</h4>
                      <Badge className={
                        comp.prioridade === 'urgente' ? 'bg-red-600' :
                        comp.prioridade === 'alta' ? 'bg-orange-600' :
                        comp.prioridade === 'media' ? 'bg-amber-600' : 'bg-blue-600'
                      }>
                        {comp.prioridade}
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>✓ Responsável: {comp.responsavel_sugerido}</p>
                      <p>✓ Prazo: {comp.prazo_dias} dias</p>
                      <p className="text-slate-700">💡 {comp.justificativa}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Devolutivas Obrigatórias */}
          {compromissos?.devolutivas_obrigatorias?.length > 0 && (
            <Card className="border-l-4 border-amber-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <MessageSquare className="w-5 h-5" />
                  Devolutivas Obrigatórias Identificadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {compromissos.devolutivas_obrigatorias.map((dev, idx) => (
                  <div key={idx} className="bg-amber-50 p-3 rounded border border-amber-200">
                    <p className="font-semibold text-sm text-amber-900">{dev.demanda_original}</p>
                    <div className="text-xs text-amber-800 mt-2 space-y-1">
                      <p>⏱️ Prazo: {dev.prazo_dias} dias</p>
                      <p>📋 Formato: {dev.formato_sugerido}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Continuidade Detectada */}
          {continuidade?.continuidades_detectadas?.length > 0 && (
            <Card className="border-l-4 border-purple-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Users className="w-5 h-5" />
                  Continuidade com Registros Anteriores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-800 mb-3">
                  Identificamos {continuidade.continuidades_detectadas.length} registro(s) relacionado(s)
                </p>
                {continuidade.continuidades_detectadas.slice(0, 2).map((cont, idx) => (
                  <div key={idx} className="bg-purple-50 p-3 rounded border border-purple-200 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{cont.titulo_registro}</p>
                      <Badge variant="outline">{cont.score_similaridade}% similar</Badge>
                    </div>
                    <p className="text-xs text-purple-700">{cont.motivo_continuidade}</p>
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