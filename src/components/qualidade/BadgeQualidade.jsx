import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function BadgeQualidade({ avaliacao, compact = false }) {
  if (!avaliacao || !avaliacao.nota_final) return null;

  const { nota_final, nota_base, peso_fonte, peso_revisao_humana, forca_fonte, revisao_humana_certificada } = avaliacao;

  const getColor = (nota) => {
    if (nota >= 8) return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (nota >= 6) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (nota >= 4) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getLabel = (nota) => {
    if (nota >= 8) return 'Excelente';
    if (nota >= 6) return 'Bom';
    if (nota >= 4) return 'Utilizável';
    return 'Frágil';
  };

  const getForcaIcon = (forca) => {
    if (forca === 'forte') return '🔵';
    if (forca === 'intermediaria') return '🟡';
    return '🔴';
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge className={cn("cursor-pointer", getColor(nota_final))}>
            {nota_final}/10 {revisao_humana_certificada && <Shield className="w-3 h-3 ml-1" />}
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-900">Qualidade: {getLabel(nota_final)}</p>
              <p className="text-2xl font-bold text-slate-900">{nota_final}/10</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Nota Base:</span>
                <span className="font-medium">{nota_base}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Peso da Fonte:</span>
                <span className="font-medium">{getForcaIcon(forca_fonte)} {(peso_fonte * 100).toFixed(0)}%</span>
              </div>
              {revisao_humana_certificada && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Revisão Humana:</span>
                  <span className="font-medium text-emerald-600">
                    <Shield className="w-3 h-3 inline mr-1" />
                    {(peso_revisao_humana * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className={cn("border-2", getColor(nota_final))}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium">Qualidade da Informação</p>
            <p className="text-xs text-slate-500">Não confundir com criticidade</p>
          </div>
          {revisao_humana_certificada && (
            <Badge className="bg-emerald-100 text-emerald-700">
              <Shield className="w-3 h-3 mr-1" />
              Revisado
            </Badge>
          )}
        </div>
        
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold text-slate-900">{nota_final}</span>
          <span className="text-lg text-slate-500 mb-1">/10</span>
          <Badge className={getColor(nota_final)}>{getLabel(nota_final)}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Nota Base</span>
            <span className="font-medium">{nota_base}/10</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Força da Fonte</span>
            <span className="font-medium">
              {getForcaIcon(forca_fonte)} {(peso_fonte * 100).toFixed(0)}%
            </span>
          </div>
          {revisao_humana_certificada && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Revisão Humana
              </span>
              <span className="font-medium text-emerald-600">
                +{(peso_revisao_humana * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {avaliacao.revisor_nome && (
          <div className="mt-3 pt-3 border-t text-xs text-slate-500">
            Revisado por {avaliacao.revisor_nome}
          </div>
        )}
      </CardContent>
    </Card>
  );
}