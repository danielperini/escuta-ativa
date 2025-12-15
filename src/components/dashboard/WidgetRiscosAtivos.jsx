import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WidgetRiscosAtivos() {
  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-ativos-widget'],
    queryFn: async () => {
      const todos = await base44.entities.RiscoSocial.list('-created_date', 50);
      return todos.filter(r => r.status === 'ativo').slice(0, 5);
    }
  });

  const getCor = (nivel) => {
    const cores = {
      baixo: 'bg-blue-100 text-blue-700 border-blue-300',
      medio: 'bg-amber-100 text-amber-700 border-amber-300',
      alto: 'bg-orange-100 text-orange-700 border-orange-300',
      critico: 'bg-red-100 text-red-700 border-red-300'
    };
    return cores[nivel] || cores.medio;
  };

  const total = riscos.length;
  const criticos = riscos.filter(r => r.nivel === 'critico').length;
  const altos = riscos.filter(r => r.nivel === 'alto').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Riscos Sociais Ativos
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2">
              {criticos > 0 && (
                <Badge className="bg-red-100 text-red-700">
                  {criticos} Crítico{criticos > 1 ? 's' : ''}
                </Badge>
              )}
              {altos > 0 && (
                <Badge className="bg-orange-100 text-orange-700">
                  {altos} Alto{altos > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {riscos.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">Nenhum risco ativo detectado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {riscos.map(risco => (
              <div 
                key={risco.id} 
                className="p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 flex-1 pr-2">{risco.titulo}</h4>
                  <Badge className={getCor(risco.nivel)} variant="outline">
                    {risco.nivel}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {risco.descricao}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  {risco.comunidade && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{risco.comunidade}</span>
                    </div>
                  )}
                  
                  {risco.tendencia && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="capitalize">{risco.tendencia}</span>
                    </div>
                  )}
                </div>

                {risco.created_date && (
                  <p className="text-xs text-slate-400 mt-2">
                    Detectado em {format(new Date(risco.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}