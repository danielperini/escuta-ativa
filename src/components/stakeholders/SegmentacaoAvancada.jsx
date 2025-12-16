import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Users, Target, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function SegmentacaoAvancada({ stakeholders, onSegmentacaoChange }) {
  const [segmentacao, setSegmentacao] = useState({
    nivel_influencia: 'todos',
    nivel_atividade: 'todos',
    score_minimo: 0,
    temas_interesse: [],
    status_cadastro: 'todos',
    engajamento_critico: null
  });

  const [showFilters, setShowFilters] = useState(false);

  // Extrair todos os temas únicos
  const todosTemasUnicos = React.useMemo(() => {
    const temas = new Set();
    stakeholders.forEach(s => {
      if (s.temas_recorrentes && Array.isArray(s.temas_recorrentes)) {
        s.temas_recorrentes.forEach(t => temas.add(t));
      }
      if (s.areas_interesse && Array.isArray(s.areas_interesse)) {
        s.areas_interesse.forEach(a => temas.add(a));
      }
    });
    return Array.from(temas).sort();
  }, [stakeholders]);

  const aplicarSegmentacao = () => {
    const filtrados = stakeholders.filter(s => {
      // Filtro de influência
      if (segmentacao.nivel_influencia !== 'todos' && s.nivel_influencia !== segmentacao.nivel_influencia) {
        return false;
      }

      // Filtro de atividade
      if (segmentacao.nivel_atividade !== 'todos' && s.nivel_atividade !== segmentacao.nivel_atividade) {
        return false;
      }

      // Filtro de score
      if ((s.score_influencia || 0) < segmentacao.score_minimo) {
        return false;
      }

      // Filtro de status
      if (segmentacao.status_cadastro !== 'todos' && s.status_cadastro !== segmentacao.status_cadastro) {
        return false;
      }

      // Filtro de temas
      if (segmentacao.temas_interesse.length > 0) {
        const temasRecorrentes = Array.isArray(s.temas_recorrentes) ? s.temas_recorrentes : [];
        const areasInteresse = Array.isArray(s.areas_interesse) ? s.areas_interesse : [];
        const temasStakeholder = [...temasRecorrentes, ...areasInteresse];
        const temAlgumTema = segmentacao.temas_interesse.some(t => temasStakeholder.includes(t));
        if (!temAlgumTema) return false;
      }

      // Filtro de engajamento crítico
      if (segmentacao.engajamento_critico !== null) {
        if (segmentacao.engajamento_critico === 'alto' && (s.engajamento_temas_criticos || 0) < 60) {
          return false;
        }
        if (segmentacao.engajamento_critico === 'baixo' && (s.engajamento_temas_criticos || 0) >= 60) {
          return false;
        }
      }

      return true;
    });

    onSegmentacaoChange(filtrados);
  };

  React.useEffect(() => {
    aplicarSegmentacao();
  }, [segmentacao]);

  const adicionarTema = (tema) => {
    if (!segmentacao.temas_interesse.includes(tema)) {
      setSegmentacao(prev => ({
        ...prev,
        temas_interesse: [...prev.temas_interesse, tema]
      }));
    }
  };

  const removerTema = (tema) => {
    setSegmentacao(prev => ({
      ...prev,
      temas_interesse: prev.temas_interesse.filter(t => t !== tema)
    }));
  };

  const limparFiltros = () => {
    setSegmentacao({
      nivel_influencia: 'todos',
      nivel_atividade: 'todos',
      score_minimo: 0,
      temas_interesse: [],
      status_cadastro: 'todos',
      engajamento_critico: null
    });
  };

  const filtrosAtivos = Object.entries(segmentacao).filter(([key, value]) => {
    if (key === 'score_minimo') return value > 0;
    if (key === 'temas_interesse') return value.length > 0;
    if (key === 'engajamento_critico') return value !== null;
    return value !== 'todos';
  }).length;

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-purple-600" />
            Segmentação Avançada
            {filtrosAtivos > 0 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {filtrosAtivos} filtro{filtrosAtivos !== 1 && 's'}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {filtrosAtivos > 0 && (
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-4">
          {/* Nível de Influência */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Nível de Influência
            </Label>
            <Select 
              value={segmentacao.nivel_influencia}
              onValueChange={(v) => setSegmentacao(prev => ({ ...prev, nivel_influencia: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="muito_alto">Muito Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nível de Atividade */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Nível de Atividade
            </Label>
            <Select 
              value={segmentacao.nivel_atividade}
              onValueChange={(v) => setSegmentacao(prev => ({ ...prev, nivel_atividade: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score de Influência */}
          <div className="space-y-2">
            <Label>Score de Influência Mínimo: {segmentacao.score_minimo}</Label>
            <Slider
              value={[segmentacao.score_minimo]}
              onValueChange={(v) => setSegmentacao(prev => ({ ...prev, score_minimo: v[0] }))}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Status do Cadastro */}
          <div className="space-y-2">
            <Label>Status do Cadastro</Label>
            <Select 
              value={segmentacao.status_cadastro}
              onValueChange={(v) => setSegmentacao(prev => ({ ...prev, status_cadastro: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="provisorio">Provisório</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="completo">Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Engajamento em Temas Críticos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Engajamento em Temas Críticos
            </Label>
            <Select 
              value={segmentacao.engajamento_critico || 'todos'}
              onValueChange={(v) => setSegmentacao(prev => ({ ...prev, engajamento_critico: v === 'todos' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="alto">Alto (≥60%)</SelectItem>
                <SelectItem value="baixo">Baixo (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temas de Interesse */}
          <div className="space-y-2">
            <Label>Temas de Interesse</Label>
            <Select onValueChange={adicionarTema}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar tema..." />
              </SelectTrigger>
              <SelectContent>
                {todosTemasUnicos.map(tema => (
                  <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {segmentacao.temas_interesse.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {segmentacao.temas_interesse.map(tema => (
                  <Badge key={tema} variant="secondary" className="gap-1">
                    {tema}
                    <button onClick={() => removerTema(tema)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}