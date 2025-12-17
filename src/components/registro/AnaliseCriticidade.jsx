import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ThermometerSun, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AnaliseCriticidade({ analise }) {
  if (!analise) return null;

  const getTemperaturaColor = (temp) => {
    if (temp >= 9) return 'bg-red-600 text-white';
    if (temp >= 7) return 'bg-orange-500 text-white';
    if (temp >= 5) return 'bg-amber-500 text-white';
    if (temp >= 3) return 'bg-blue-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const getTemperaturaLabel = (temp) => {
    if (temp >= 9) return 'CRÍTICA';
    if (temp >= 7) return 'Alta';
    if (temp >= 5) return 'Elevada';
    if (temp >= 3) return 'Moderada';
    return 'Baixa';
  };

  return (
    <Card className={cn(
      "border-2",
      analise.caso_critico ? "border-red-500 bg-red-50" : "border-blue-200 bg-blue-50"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {analise.caso_critico ? (
            <>
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-900">Análise de Criticidade</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900">Análise Territorial</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Temperatura do Território */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            <ThermometerSun className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-sm text-slate-600">Temperatura do Território</p>
              <p className="font-semibold text-slate-900">{getTemperaturaLabel(analise.temperatura_territorio)}</p>
            </div>
          </div>
          <Badge className={cn("text-lg font-bold px-4 py-2", getTemperaturaColor(analise.temperatura_territorio))}>
            {analise.temperatura_territorio}/10
          </Badge>
        </div>

        {/* Local e Comunidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Local
            </p>
            <p className="text-sm font-medium text-slate-900">{analise.local || 'Não identificado'}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-slate-500 mb-1">Comunidade Territorial</p>
            <p className="text-sm font-medium text-slate-900">{analise.comunidade_territorial}</p>
          </div>
        </div>

        {/* Caso Crítico */}
        <div className={cn(
          "p-4 rounded-lg border",
          analise.caso_critico ? "bg-red-100 border-red-300" : "bg-emerald-100 border-emerald-300"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {analise.caso_critico ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            <span className={cn(
              "font-semibold",
              analise.caso_critico ? "text-red-900" : "text-emerald-900"
            )}>
              {analise.caso_critico ? 'CASO CRÍTICO' : 'Caso Não Crítico'}
            </span>
          </div>
        </div>

        {/* Justificativa */}
        <div className="p-4 bg-white rounded-lg border">
          <p className="text-xs text-slate-500 mb-2 font-semibold">Justificativa</p>
          <p className="text-sm text-slate-700 leading-relaxed">{analise.justificativa}</p>
        </div>

        {/* Recomendação */}
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 mb-2 font-semibold">Recomendação</p>
          <p className="text-sm text-amber-900 leading-relaxed">{analise.recomendacao}</p>
        </div>
      </CardContent>
    </Card>
  );
}