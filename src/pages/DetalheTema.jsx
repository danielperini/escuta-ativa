import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, FileText, BarChart3, Loader2, 
  Sparkles, Download, Calendar, TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const categoriaColors = {
  ambiental: 'bg-green-100 text-green-700',
  social: 'bg-blue-100 text-blue-700',
  economico: 'bg-amber-100 text-amber-700',
  infraestrutura: 'bg-purple-100 text-purple-700',
  saude: 'bg-red-100 text-red-700',
  educacao: 'bg-indigo-100 text-indigo-700',
  seguranca: 'bg-orange-100 text-orange-700',
  emprego: 'bg-teal-100 text-teal-700',
  cultura: 'bg-pink-100 text-pink-700',
  outro: 'bg-slate-100 text-slate-700'
};

export default function DetalheTema() {
  const urlParams = new URLSearchParams(window.location.search);
  const temaId = urlParams.get('id');
  const [analise, setAnalise] = useState('');
  const [gerandoAnalise, setGerandoAnalise] = useState(false);

  const { data: tema, isLoading: loadingTema } = useQuery({
    queryKey: ['tema', temaId],
    queryFn: async () => {
      const temas = await base44.entities.Tema.filter({ id: temaId });
      return temas[0];
    },
    enabled: !!temaId
  });

  const { data: registros = [], isLoading: loadingRegistros } = useQuery({
    queryKey: ['registros-tema', tema?.nome],
    queryFn: async () => {
      const allRegistros = await base44.entities.Registro.list('-created_date', 500);
      return allRegistros.filter(r => 
        r.temas_identificados?.some(t => 
          t.toLowerCase().includes(tema.nome.toLowerCase()) || 
          tema.nome.toLowerCase().includes(t.toLowerCase())
        )
      );
    },
    enabled: !!tema
  });

  const gerarAnalise = async () => {
    if (!tema) return;
    setGerandoAnalise(true);

    const contextoRegistros = registros.slice(0, 15).map(r => 
      `📅 ${r.data_registro || r.created_date}: ${r.titulo}\n` +
      `📍 ${r.comunidade}\n` +
      `📝 ${r.descricao?.substring(0, 300)}\n` +
      `${r.demandas?.length > 0 ? `⚠️ Demandas: ${r.demandas.map(d => d.descricao).join('; ')}\n` : ''}`
    ).join('\n---\n\n');

    const porComunidade = registros.reduce((acc, r) => {
      const com = r.comunidade || 'Não especificada';
      acc[com] = (acc[com] || 0) + 1;
      return acc;
    }, {});

    const comunidadesOrdenadas = Object.entries(porComunidade)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const demandas = registros.flatMap(r => r.demandas || []).slice(0, 20);

    const prompt = `Você é um analista de impactos socioambientais. Crie uma análise completa e detalhada sobre o tema:

**TEMA:** ${tema.nome}
**CATEGORIA:** ${tema.categoria}
**RELEVÂNCIA COMUNIDADE:** ${tema.relevancia_comunidade}/10
**RELEVÂNCIA EMPRESA:** ${tema.relevancia_empresa}/10
**DIVERGÊNCIA:** ${tema.divergencia || 0}
**TOTAL DE MENÇÕES:** ${registros.length} registros

**DISTRIBUIÇÃO POR COMUNIDADE:**
${comunidadesOrdenadas.map(([com, count]) => `- ${com}: ${count} menções`).join('\n')}

**REGISTROS DETALHADOS (últimos 15):**
${contextoRegistros}

**DEMANDAS IDENTIFICADAS:**
${demandas.map(d => `- [${d.urgencia}] ${d.descricao}`).join('\n')}

**INSTRUÇÕES:**
Crie uma análise profunda em português do Brasil, estruturada em:

1. **Síntese do Tema**: O que está sendo discutido, contexto geral
2. **Análise Territorial**: Onde o tema aparece mais, padrões geográficos
3. **Principais Impactos Identificados**: Liste e descreva os impactos mencionados nos registros
4. **Demandas e Preocupações Comunitárias**: O que as comunidades estão pedindo/reclamando
5. **Análise de Divergência**: Se há diferença entre relevância para comunidade vs empresa, explique
6. **Recomendações Estratégicas**: Ações sugeridas para gestão deste tema

Seja específico, cite dados dos registros, use tom técnico e profissional.
Máximo 800 palavras.`;

    try {
      const resultado = await base44.integrations.Core.InvokeLLM({ 
        prompt,
        add_context_from_internet: false
      });
      setAnalise(resultado);
    } catch (error) {
      alert('Erro ao gerar análise: ' + error.message);
    } finally {
      setGerandoAnalise(false);
    }
  };

  if (loadingTema) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!tema) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">Tema não encontrado</h3>
        <Link to={createPageUrl('Materialidade')}>
          <Button className="mt-4" variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const porComunidade = registros.reduce((acc, r) => {
    const com = r.comunidade || 'Não especificada';
    acc[com] = (acc[com] || 0) + 1;
    return acc;
  }, {});

  const comunidadesOrdenadas = Object.entries(porComunidade)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to={createPageUrl('Materialidade')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{tema.nome}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={categoriaColors[tema.categoria]}>
              {tema.categoria}
            </Badge>
            {tema.prioritario && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                Prioritário
              </Badge>
            )}
            {tema.tendencia && (
              <Badge variant="outline" className="flex items-center gap-1">
                {tema.tendencia === 'subindo' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                {tema.tendencia}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Menções</div>
          <div className="text-2xl font-bold text-slate-900">{registros.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Comunidades</div>
          <div className="text-2xl font-bold text-blue-600">{Object.keys(porComunidade).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Rel. Comunidade</div>
          <div className="text-2xl font-bold text-emerald-600">{tema.relevancia_comunidade || 5}/10</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Rel. Empresa</div>
          <div className="text-2xl font-bold text-purple-600">{tema.relevancia_empresa || 5}/10</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2D6A4F]" />
                Análise Profunda
              </CardTitle>
              <Button
                onClick={gerarAnalise}
                disabled={gerandoAnalise || loadingRegistros}
                size="sm"
                className="bg-[#2D6A4F] hover:bg-[#1B4332]"
              >
                {gerandoAnalise ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {analise ? 'Atualizar' : 'Gerar Análise'}
              </Button>
            </CardHeader>
            <CardContent>
              {analise ? (
                <div>
                  <Textarea
                    value={analise}
                    onChange={(e) => setAnalise(e.target.value)}
                    rows={25}
                    className="font-serif text-sm leading-relaxed whitespace-pre-wrap"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(analise);
                      alert('✓ Análise copiada!');
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copiar Texto
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Clique em "Gerar Análise" para criar uma análise completa baseada nos registros</p>
                  <p className="text-xs mt-2">
                    {registros.length} registro(s) serão analisados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registros Relacionados ({registros.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {loadingRegistros ? (
                <Skeleton className="h-20" />
              ) : registros.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhum registro encontrado</p>
              ) : (
                registros.map(registro => (
                  <Link 
                    key={registro.id}
                    to={createPageUrl('VerRegistro') + `?id=${registro.id}`}
                  >
                    <div className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="font-medium text-sm text-slate-900 hover:text-blue-600">
                        {registro.titulo}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(registro.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {registro.comunidade}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Comunidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {comunidadesOrdenadas.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma comunidade identificada</p>
              ) : (
                comunidadesOrdenadas.map(([comunidade, count]) => (
                  <div key={comunidade} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm text-slate-700">{comunidade}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Divergência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={cn(
                  "text-4xl font-bold mb-2",
                  tema.divergencia > 3 ? "text-red-600" : 
                  tema.divergencia > 1 ? "text-amber-600" : "text-emerald-600"
                )}>
                  {tema.divergencia || 0}
                </div>
                <p className="text-xs text-slate-500">
                  Diferença entre percepção da comunidade e da empresa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}