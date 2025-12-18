import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Leaf, FileText, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WidgetSustentabilidade() {
  const { data: metas = [] } = useQuery({
    queryKey: ['metas-ods-dashboard'],
    queryFn: () => base44.entities.MetaODS.list('-created_date', 10)
  });

  const { data: relatorios = [] } = useQuery({
    queryKey: ['relatorios-sustentabilidade-dashboard'],
    queryFn: () => base44.entities.RelatorioSustentabilidade.list('-created_date', 5)
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-ods-dashboard'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const metasAtingidas = metas.filter(m => m.status === 'atingida').length;
  const progressoMedio = metas.length > 0
    ? metas.reduce((acc, m) => acc + (m.percentual_conclusao || 0), 0) / metas.length
    : 0;

  const registrosComODS = registros.filter(r => r.vinculacao_ods && r.vinculacao_ods.length > 0).length;

  return (
    <Card className="hover:shadow-lg transition-all border-t-4 border-emerald-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="w-5 h-5 text-emerald-600" />
          Sustentabilidade & ODS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{metas.length}</p>
            <p className="text-xs text-slate-600">Metas ODS</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{relatorios.length}</p>
            <p className="text-xs text-slate-600">Relatórios</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{registrosComODS}</p>
            <p className="text-xs text-slate-600">Ações ODS</p>
          </div>
        </div>

        {/* Progresso das Metas */}
        {metas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Progresso das Metas</span>
              <Badge className="bg-emerald-100 text-emerald-700">
                {metasAtingidas}/{metas.length} atingidas
              </Badge>
            </div>
            <Progress value={progressoMedio} className="h-2" />
            <p className="text-xs text-slate-500 text-right">{Math.round(progressoMedio)}% concluído</p>
          </div>
        )}

        {/* Últimas Metas */}
        {metas.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Metas Recentes</p>
            {metas.slice(0, 3).map(meta => (
              <div key={meta.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 truncate">
                    ODS {meta.ods_numero}: {meta.meta_descricao}
                  </p>
                  <p className="text-xs text-slate-500">
                    {meta.valor_atual}/{meta.meta_quantitativa} {meta.unidade_medida}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {meta.percentual_conclusao}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Nenhuma meta ODS definida</p>
            <Link to={createPageUrl('ODS')}>
              <Button variant="link" size="sm" className="text-emerald-600 mt-2">
                Definir Metas
              </Button>
            </Link>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="flex gap-2 pt-2 border-t">
          <Link to={createPageUrl('ODS')} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Target className="w-4 h-4 mr-2" />
              ODS
            </Button>
          </Link>
          <Link to={createPageUrl('GeradorRelatorioSustentabilidade')} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Relatório
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}