import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export function CoberturaFontes() {
  const { data: fontes = [] } = useQuery({
    queryKey: ['cobertura-fontes'],
    queryFn: async () => base44.entities.FonteDados.list('-last_test_at', 50),
    staleTime: 5 * 60 * 1000,
  });

  const total = fontes.length;
  const ativas = fontes.filter((f) => f.status === 'ATIVA' && f.visible).length;
  const indisponiveis = total - ativas;
  const pct = total > 0 ? Math.round((ativas / total) * 100) : 0;
  const corClass = pct >= 75 ? 'text-emerald-600' : (pct >= 50 ? 'text-amber-600' : 'text-red-600');

  if (total === 0) return null;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className={`w-5 h-5 ${corClass}`} />
          <span className="font-medium">Cobertura de dados:</span>
          <span className={`${corClass} font-semibold`}>{ativas} de {total} fontes ativas</span>
          <span className="text-xs text-muted-foreground">({pct}% disponível)</span>
          {indisponiveis > 0 && (
            <span className="text-xs text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {indisponiveis} indisponível(is)
            </span>
          )}
        </div>
        <Link
          to={createPageUrl('SaudeFontes')}
          className="text-xs text-primary hover:underline"
        >
          Ver detalhes →
        </Link>
      </div>
    </Card>
  );
}