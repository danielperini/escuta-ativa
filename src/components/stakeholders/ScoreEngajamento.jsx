import React, { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Target, Calendar, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ScoreEngajamento({ stakeholder, registros = [], casos = [], riscos = [] }) {
  const queryClient = useQueryClient();

  const calcularScore = () => {
    let score = 0;
    const detalhes = {
      interacoes: 0,
      recencia: 0,
      casos: 0,
      riscos: 0,
      temas_criticos: 0
    };

    // 1. Número de interações (máx 30 pontos)
    const numInteracoes = registros.length;
    detalhes.interacoes = Math.min(30, numInteracoes * 2);
    score += detalhes.interacoes;

    // 2. Recência das interações (máx 20 pontos)
    if (registros.length > 0) {
      const ultimaInteracao = new Date(registros[0].created_date);
      const diasDesdeUltima = Math.floor((new Date() - ultimaInteracao) / (1000 * 60 * 60 * 24));
      
      if (diasDesdeUltima <= 7) detalhes.recencia = 20;
      else if (diasDesdeUltima <= 30) detalhes.recencia = 15;
      else if (diasDesdeUltima <= 90) detalhes.recencia = 10;
      else detalhes.recencia = 5;
      
      score += detalhes.recencia;
    }

    // 3. Envolvimento em casos (máx 25 pontos)
    const casosAtivos = casos.filter(c => c.status !== 'resolvido');
    detalhes.casos = Math.min(25, casosAtivos.length * 8);
    score += detalhes.casos;

    // 4. Envolvimento em riscos (máx 15 pontos)
    const riscosAtivos = riscos.filter(r => r.status === 'ativo');
    detalhes.riscos = Math.min(15, riscosAtivos.length * 7);
    score += detalhes.riscos;

    // 5. Engajamento em temas críticos (máx 10 pontos)
    const temasCriticos = ['conflito', 'risco', 'urgente', 'crítico'];
    const mencionsTemasCriticos = registros.filter(r => 
      r.temas_identificados?.some(tema => 
        temasCriticos.some(tc => tema.toLowerCase().includes(tc))
      )
    ).length;
    detalhes.temas_criticos = Math.min(10, mencionsTemasCriticos * 3);
    score += detalhes.temas_criticos;

    return { score: Math.min(100, score), detalhes };
  };

  const { score, detalhes } = calcularScore();

  const atualizarScoreMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Stakeholder.update(stakeholder.id, {
        score_engajamento: score,
        historico_interacoes: registros.length,
        ultima_interacao: registros[0]?.created_date || stakeholder.ultima_interacao
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
    }
  });

  // Atualizar score automaticamente
  useEffect(() => {
    if (score !== stakeholder.score_engajamento) {
      atualizarScoreMutation.mutate();
    }
  }, [score]);

  const getScoreColor = (value) => {
    if (value >= 75) return 'text-green-600';
    if (value >= 50) return 'text-blue-600';
    if (value >= 25) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (value) => {
    if (value >= 75) return 'Altamente Engajado';
    if (value >= 50) return 'Engajado';
    if (value >= 25) return 'Moderadamente Engajado';
    return 'Baixo Engajamento';
  };

  const getNivelAtividade = () => {
    if (score >= 75) return 'alto';
    if (score >= 50) return 'moderado';
    if (score >= 25) return 'baixo';
    return 'inativo';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Score de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Principal */}
        <div className="text-center">
          <div className={cn("text-6xl font-bold mb-2", getScoreColor(score))}>
            {score}
          </div>
          <Badge className={cn(
            "mb-3",
            score >= 75 ? "bg-green-100 text-green-700" :
            score >= 50 ? "bg-blue-100 text-blue-700" :
            score >= 25 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          )}>
            <Award className="w-3 h-3 mr-1" />
            {getScoreLabel(score)}
          </Badge>
          <Progress value={score} className="h-3" />
        </div>

        {/* Detalhamento do Score */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase">Composição do Score</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">Interações</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{registros.length}</span>
                <Badge variant="outline">{detalhes.interacoes}/30</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Recência</span>
              </div>
              <Badge variant="outline">{detalhes.recencia}/20</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-700">Casos Ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{casos.length}</span>
                <Badge variant="outline">{detalhes.casos}/25</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-slate-700">Riscos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{riscos.length}</span>
                <Badge variant="outline">{detalhes.riscos}/15</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-slate-700">Temas Críticos</span>
              </div>
              <Badge variant="outline">{detalhes.temas_criticos}/10</Badge>
            </div>
          </div>
        </div>

        {/* Nível de Atividade Atualizado */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-slate-600 mb-1">Nível de Atividade Atual</p>
          <Badge className={cn(
            "capitalize",
            getNivelAtividade() === 'alto' ? "bg-green-100 text-green-700" :
            getNivelAtividade() === 'moderado' ? "bg-blue-100 text-blue-700" :
            getNivelAtividade() === 'baixo' ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-700"
          )}>
            {getNivelAtividade()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}