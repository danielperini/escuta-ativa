import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, TrendingUp, Target, CheckCircle2 } from 'lucide-react';

export default function ODSCard({ numero, nome, cor, icon, totalAcoes, metas, onEditarMeta, onNovaMeta }) {
  const metasAtingidas = metas.filter(m => m.status === 'atingida').length;
  const progressoMedio = metas.length > 0 
    ? metas.reduce((acc, m) => acc + (m.percentual_conclusao || 0), 0) / metas.length 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-all" style={{ borderTop: `4px solid ${cor}` }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: cor }}
            >
              {icon}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">ODS {numero}</div>
              <CardTitle className="text-sm leading-tight mt-1">{nome}</CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Ações Vinculadas</span>
          <Badge className="bg-slate-100 text-slate-900">{totalAcoes}</Badge>
        </div>

        {metas.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Progresso Médio</span>
                <span className="font-semibold" style={{ color: cor }}>{Math.round(progressoMedio)}%</span>
              </div>
              <Progress value={progressoMedio} style={{ 
                backgroundColor: `${cor}20`,
              }} />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-slate-600">{metasAtingidas} de {metas.length} metas</span>
              </div>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {metas.map(meta => (
                <div 
                  key={meta.id}
                  className="p-2 bg-slate-50 rounded text-xs cursor-pointer hover:bg-slate-100"
                  onClick={() => onEditarMeta(meta)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{meta.meta_descricao}</span>
                    <Badge variant="outline" className="text-xs">
                      {meta.percentual_conclusao}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-slate-500 text-xs">
            Nenhuma meta definida
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onNovaMeta}
          style={{ color: cor, borderColor: `${cor}40` }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {metas.length > 0 ? 'Adicionar Meta' : 'Definir Meta'}
        </Button>
      </CardContent>
    </Card>
  );
}