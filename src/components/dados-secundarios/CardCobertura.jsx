import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Database } from 'lucide-react';

/**
 * CardCobertura — Resumo no topo da página Dados Secundários mostrando
 * quantos indicadores/territórios estão disponíveis, indisponíveis temporariamente,
 * ou sem cobertura municipal para a seção ativa.
 */
export function CardCobertura({ encontrados, indisponiveis, semCobertura, secaoLabel }) {
  const total = encontrados + indisponiveis + semCobertura;
  if (total === 0) return null;

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-foreground">Cobertura dos Dados</span>
        {secaoLabel && <span className="text-xs text-muted-foreground">· {secaoLabel}</span>}
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {encontrados} encontrado(s)
        </span>
        {indisponiveis > 0 && (
          <span className="flex items-center gap-1 text-amber-700">
            <AlertTriangle className="w-4 h-4" /> {indisponiveis} indisponível(is)
          </span>
        )}
        {semCobertura > 0 && (
          <span className="flex items-center gap-1 text-slate-600">
            <Database className="w-4 h-4" /> {semCobertura} sem cobertura municipal
          </span>
        )}
      </div>
    </Card>
  );
}