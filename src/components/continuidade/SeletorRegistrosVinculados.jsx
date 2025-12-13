import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, MapPin, Users, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SeletorRegistrosVinculados({ 
  textoAtual, 
  comunidade, 
  participantes = [],
  onRegistrosSelecionados 
}) {
  const [analisando, setAnalisando] = useState(false);
  const [registrosSugeridos, setRegistrosSugeridos] = useState([]);
  const [registrosSelecionados, setRegistrosSelecionados] = useState([]);

  const { data: todosRegistros = [], isLoading } = useQuery({
    queryKey: ['registros-vinculos'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100),
    staleTime: 60000
  });

  const detectarContinuidades = async () => {
    setAnalisando(true);

    const registrosFiltrados = todosRegistros.filter(r => 
      r.comunidade === comunidade || 
      participantes.some(p => r.participantes?.includes(p))
    );

    const contextoCandidatos = registrosFiltrados.slice(0, 20).map(r => ({
      id: r.id,
      titulo: r.titulo,
      resumo: r.descricao?.substring(0, 200),
      data: r.created_date,
      comunidade: r.comunidade,
      participantes: r.participantes,
      temas: r.temas_identificados,
      demandas: r.demandas?.map(d => d.descricao).slice(0, 3)
    }));

    const prompt = `Analise se o NOVO REGISTRO abaixo possui continuidade com REGISTROS ANTERIORES:

**NOVO REGISTRO:**
${textoAtual}

**REGISTROS ANTERIORES (candidatos):**
${JSON.stringify(contextoCandidatos, null, 2)}

Identifique quais registros anteriores têm CONTINUIDADE com o novo registro, considerando:
- Mesmos participantes/stakeholders
- Temas relacionados ou iguais
- Demandas recorrentes ou em andamento
- Compromissos que estão sendo verificados
- Localização geográfica próxima

Retorne APENAS os IDs dos registros que possuem continuidade clara.
Se não houver continuidade, retorne array vazio.`;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            registros_continuidade: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  motivo_continuidade: { type: "string" },
                  score_similaridade: { type: "number" }
                }
              }
            }
          }
        }
      });

      const idsDetectados = resultado.registros_continuidade?.map(r => r.id) || [];
      const registrosComDetalhes = todosRegistros.filter(r => idsDetectados.includes(r.id));
      
      const registrosComMotivo = registrosComDetalhes.map(reg => {
        const detalhes = resultado.registros_continuidade.find(r => r.id === reg.id);
        return {
          ...reg,
          motivo_continuidade: detalhes?.motivo_continuidade,
          score_similaridade: detalhes?.score_similaridade
        };
      });

      setRegistrosSugeridos(registrosComMotivo.sort((a, b) => 
        (b.score_similaridade || 0) - (a.score_similaridade || 0)
      ));
    } catch (error) {
      alert('Erro ao detectar continuidades: ' + error.message);
    } finally {
      setAnalisando(false);
    }
  };

  const toggleRegistro = (registroId) => {
    setRegistrosSelecionados(prev => 
      prev.includes(registroId) 
        ? prev.filter(id => id !== registroId)
        : [...prev, registroId]
    );
  };

  const confirmarVinculos = () => {
    onRegistrosSelecionados(registrosSelecionados);
  };

  if (isLoading) {
    return <Skeleton className="h-48 rounded-lg" />;
  }

  return (
    <Card className="border-2 border-purple-600">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <FileText className="w-6 h-6" />
          Registros Anteriores para Vincular
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            A IA pode detectar automaticamente quais registros anteriores têm continuidade com este novo registro.
          </p>
        </div>

        {registrosSugeridos.length === 0 ? (
          <div className="text-center py-6">
            <Button
              onClick={detectarContinuidades}
              disabled={analisando || !textoAtual}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analisando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detectando continuidades...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Detectar Registros Relacionados
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {registrosSugeridos.length} registro(s) com possível continuidade
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRegistrosSelecionados(registrosSugeridos.map(r => r.id))}
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRegistrosSelecionados([])}
                >
                  Desmarcar Todos
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {registrosSugeridos.map(registro => {
                const isSelected = registrosSelecionados.includes(registro.id);
                
                return (
                  <div
                    key={registro.id}
                    onClick={() => toggleRegistro(registro.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-purple-600 bg-purple-50" 
                        : "border-slate-200 hover:border-purple-300 bg-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRegistro(registro.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{registro.titulo}</h4>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {registro.descricao}
                            </p>
                          </div>
                          {registro.score_similaridade && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {Math.round(registro.score_similaridade * 100)}% match
                            </Badge>
                          )}
                        </div>

                        {registro.motivo_continuidade && (
                          <div className="mt-2 p-2 bg-purple-100/50 rounded text-xs text-purple-900">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            {registro.motivo_continuidade}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(registro.created_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {registro.comunidade}
                          </span>
                          {registro.participantes?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {registro.participantes.slice(0, 2).join(', ')}
                              {registro.participantes.length > 2 && ` +${registro.participantes.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-slate-600">
                {registrosSelecionados.length} registro(s) selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRegistrosSelecionados([]);
                    onRegistrosSelecionados([]);
                  }}
                >
                  Não Vincular
                </Button>
                <Button
                  onClick={confirmarVinculos}
                  disabled={registrosSelecionados.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Vincular {registrosSelecionados.length > 0 && `(${registrosSelecionados.length})`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}