import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Filter,
  MapPin,
  Tag,
  FileSearch,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CentralAnalise() {
  const queryClient = useQueryClient();
  const [filtroAnalise, setFiltroAnalise] = useState('todos');
  const [registrosSelecionados, setRegistrosSelecionados] = useState([]);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState({ atual: 0, total: 0 });
  const [resultadosLote, setResultadosLote] = useState([]);

  const { data: registros = [], isLoading } = useQuery({
    queryKey: ['registros-analise'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  // Classificar registros por status de análise
  const registrosClassificados = registros.map(r => {
    const faltaMunicipio = !r.localizacao?.municipio;
    const faltaTemas = !r.temas_identificados || r.temas_identificados.length === 0;
    const faltaResumo = !r.resumo_automatico;
    const faltaAnaliseCompleta = faltaMunicipio || faltaTemas || faltaResumo;

    return {
      ...r,
      pendencias: {
        municipio: faltaMunicipio,
        temas: faltaTemas,
        resumo: faltaResumo,
        completa: faltaAnaliseCompleta
      },
      score: (faltaMunicipio ? 1 : 0) + (faltaTemas ? 1 : 0) + (faltaResumo ? 1 : 0)
    };
  });

  const registrosFiltrados = registrosClassificados.filter(r => {
    if (filtroAnalise === 'todos') return true;
    if (filtroAnalise === 'pendente') return r.pendencias.completa;
    if (filtroAnalise === 'sem_municipio') return r.pendencias.municipio;
    if (filtroAnalise === 'sem_temas') return r.pendencias.temas;
    if (filtroAnalise === 'sem_resumo') return r.pendencias.resumo;
    if (filtroAnalise === 'completo') return !r.pendencias.completa;
    return true;
  }).sort((a, b) => b.score - a.score);

  const toggleSelecao = (id) => {
    setRegistrosSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (registrosSelecionados.length === registrosFiltrados.length) {
      setRegistrosSelecionados([]);
    } else {
      setRegistrosSelecionados(registrosFiltrados.map(r => r.id));
    }
  };

  const analisarRegistro = async (registro) => {
    try {
      const textoConsolidado = [
        registro.titulo,
        registro.descricao,
        registro.transcricao,
        registro.local
      ].filter(Boolean).join('\n\n');

      if (!textoConsolidado.trim()) {
        return { sucesso: false, erro: 'Registro sem conteúdo para análise' };
      }

      const analise = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este registro de interação comunitária e extraia informações estruturadas:

${textoConsolidado}

Extraia:
1. Município e Estado (UF) mencionados
2. Temas principais discutidos (até 5)
3. Resumo executivo em 2-3 parágrafos
4. Sentimento geral (positivo/neutro/negativo/misto)

Retorne apenas dados estruturados.`,
        response_json_schema: {
          type: "object",
          properties: {
            municipio: { type: "string" },
            estado: { type: "string" },
            temas: { type: "array", items: { type: "string" } },
            resumo: { type: "string" },
            sentimento: { type: "string" }
          }
        }
      });

      const dadosAtualizados = {
        localizacao: {
          ...registro.localizacao,
          municipio: analise.municipio || registro.localizacao?.municipio || '',
          estado: analise.estado || registro.localizacao?.estado || ''
        },
        temas_identificados: analise.temas || registro.temas_identificados || [],
        resumo_automatico: analise.resumo || registro.resumo_automatico || '',
        sentimento: analise.sentimento || registro.sentimento || ''
      };

      await base44.entities.Registro.update(registro.id, dadosAtualizados);

      return { sucesso: true, dados: dadosAtualizados };
    } catch (error) {
      return { sucesso: false, erro: error.message };
    }
  };

  const processarLote = async () => {
    const registrosParaProcessar = registrosFiltrados.filter(r =>
      registrosSelecionados.includes(r.id)
    );

    if (registrosParaProcessar.length === 0) {
      toast.error('Selecione ao menos um registro');
      return;
    }

    setProcessandoLote(true);
    setProgressoLote({ atual: 0, total: registrosParaProcessar.length });
    setResultadosLote([]);

    const resultados = [];

    for (let i = 0; i < registrosParaProcessar.length; i++) {
      const registro = registrosParaProcessar[i];
      setProgressoLote({ atual: i + 1, total: registrosParaProcessar.length });

      const resultado = await analisarRegistro(registro);
      resultados.push({
        id: registro.id,
        titulo: registro.titulo,
        ...resultado
      });

      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setResultadosLote(resultados);
    setProcessandoLote(false);
    queryClient.invalidateQueries({ queryKey: ['registros-analise'] });

    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    toast.success(`Processamento concluído: ${sucessos} sucesso(s), ${falhas} falha(s)`);
  };

  const estatisticas = {
    total: registros.length,
    pendentes: registrosClassificados.filter(r => r.pendencias.completa).length,
    semMunicipio: registrosClassificados.filter(r => r.pendencias.municipio).length,
    semTemas: registrosClassificados.filter(r => r.pendencias.temas).length,
    semResumo: registrosClassificados.filter(r => r.pendencias.resumo).length,
    completos: registrosClassificados.filter(r => !r.pendencias.completa).length
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Central de Análise</h1>
          <p className="text-slate-500 mt-1">Processamento inteligente de registros</p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['registros-analise'] })}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-2 border-slate-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-2xl font-bold">{estatisticas.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-amber-900">{estatisticas.pendentes}</p>
              <p className="text-xs text-amber-700">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-900">{estatisticas.semMunicipio}</p>
              <p className="text-xs text-blue-700">Sem Município</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Tag className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">{estatisticas.semTemas}</p>
              <p className="text-xs text-purple-700">Sem Temas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileSearch className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-orange-900">{estatisticas.semResumo}</p>
              <p className="text-xs text-orange-700">Sem Resumo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-900">{estatisticas.completos}</p>
              <p className="text-xs text-emerald-700">Completos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Filter className="w-5 h-5 text-slate-500" />
              <Select value={filtroAnalise} onValueChange={setFiltroAnalise}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os registros</SelectItem>
                  <SelectItem value="pendente">Pendentes de análise</SelectItem>
                  <SelectItem value="sem_municipio">Sem município</SelectItem>
                  <SelectItem value="sem_temas">Sem temas</SelectItem>
                  <SelectItem value="sem_resumo">Sem resumo</SelectItem>
                  <SelectItem value="completo">Análise completa</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">{registrosFiltrados.length} registros</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={selecionarTodos}
                variant="outline"
                size="sm"
                disabled={registrosFiltrados.length === 0}
              >
                {registrosSelecionados.length === registrosFiltrados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
              <Button
                onClick={processarLote}
                disabled={registrosSelecionados.length === 0 || processandoLote}
                className="bg-[#E31E24] hover:bg-[#B01419] gap-2"
              >
                {processandoLote ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Processar Selecionados ({registrosSelecionados.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso do Lote */}
      {processandoLote && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  Processando registros...
                </p>
                <p className="text-sm text-blue-700">
                  {progressoLote.atual} de {progressoLote.total}
                </p>
              </div>
              <Progress
                value={(progressoLote.atual / progressoLote.total) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados do Lote */}
      {resultadosLote.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resultados do Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {resultadosLote.map((resultado, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    resultado.sucesso
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {resultado.sucesso ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{resultado.titulo}</p>
                      {!resultado.sucesso && (
                        <p className="text-xs text-red-600">{resultado.erro}</p>
                      )}
                    </div>
                  </div>
                  <Link to={createPageUrl('VerRegistro') + `?id=${resultado.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-slate-400" />
              <p className="text-slate-500">Carregando registros...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrosFiltrados.map((registro) => (
                <div
                  key={registro.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    registrosSelecionados.includes(registro.id)
                      ? "bg-blue-50 border-blue-300"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                  )}
                >
                  <Checkbox
                    checked={registrosSelecionados.includes(registro.id)}
                    onCheckedChange={() => toggleSelecao(registro.id)}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link to={createPageUrl('VerRegistro') + `?id=${registro.id}`}>
                          <h3 className="font-medium text-slate-900 hover:text-[#E31E24] transition-colors truncate">
                            {registro.titulo || 'Sem título'}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1">
                          {registro.created_date && format(new Date(registro.created_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          {registro.comunidade && ` • ${registro.comunidade}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {registro.pendencias.completa ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {registro.pendencias.municipio && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <MapPin className="w-3 h-3 mr-1" />
                          Município
                        </Badge>
                      )}
                      {registro.pendencias.temas && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          <Tag className="w-3 h-3 mr-1" />
                          Temas
                        </Badge>
                      )}
                      {registro.pendencias.resumo && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                          <FileSearch className="w-3 h-3 mr-1" />
                          Resumo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}