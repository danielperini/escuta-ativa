import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WidgetTemperaturaTerritorial() {
  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-temperatura'],
    queryFn: () => base44.entities.RiscoSocial.filter({ status: 'ativo' })
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-temperatura'],
    queryFn: () => base44.entities.Stakeholder.list('-created_date', 500)
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-temperatura'],
    queryFn: () => base44.entities.Registro.list('-created_date', 200)
  });

  // Agregar dados por comunidade
  const comunidadesData = React.useMemo(() => {
    const map = new Map();

    // Processar riscos
    riscos.forEach(r => {
      if (!r.comunidade) return;
      if (!map.has(r.comunidade)) {
        map.set(r.comunidade, { riscos: 0, riscosAltos: 0, stakeholders: 0, engajamento: 0, registros: 0, temperatura: 0 });
      }
      const data = map.get(r.comunidade);
      data.riscos++;
      if (['alto', 'critico'].includes(r.nivel)) data.riscosAltos++;
    });

    // Processar stakeholders
    stakeholders.forEach(s => {
      if (!s.comunidade) return;
      if (!map.has(s.comunidade)) {
        map.set(s.comunidade, { riscos: 0, riscosAltos: 0, stakeholders: 0, engajamento: 0, registros: 0, temperatura: 0 });
      }
      const data = map.get(s.comunidade);
      data.stakeholders++;
      data.engajamento += s.score_engajamento || 0;
    });

    // Processar registros
    registros.forEach(r => {
      if (!r.comunidade) return;
      if (!map.has(r.comunidade)) {
        map.set(r.comunidade, { riscos: 0, riscosAltos: 0, stakeholders: 0, engajamento: 0, registros: 0, temperatura: 0 });
      }
      const data = map.get(r.comunidade);
      data.registros++;
      
      // Temperatura do território (média ponderada)
      const tempMap = { baixo: 1, medio: 2, alto: 3, critico: 4 };
      if (r.temperatura_territorio) {
        data.temperatura += tempMap[r.temperatura_territorio] || 0;
      }
    });

    // Calcular médias e temperatura final
    const resultado = Array.from(map.entries()).map(([comunidade, data]) => {
      const mediaEngajamento = data.stakeholders > 0 ? data.engajamento / data.stakeholders : 0;
      const temperaturaMedia = data.registros > 0 ? data.temperatura / data.registros : 0;
      
      // Score composto: riscos + temperatura - engajamento
      const scoreFinal = (data.riscosAltos * 30) + (temperaturaMedia * 15) - (mediaEngajamento * 0.3);
      
      let nivel = 'baixo';
      if (scoreFinal > 60) nivel = 'critico';
      else if (scoreFinal > 40) nivel = 'alto';
      else if (scoreFinal > 20) nivel = 'medio';

      return {
        comunidade,
        ...data,
        mediaEngajamento: Math.round(mediaEngajamento),
        temperaturaMedia: temperaturaMedia.toFixed(1),
        scoreFinal: Math.round(scoreFinal),
        nivel
      };
    });

    return resultado.sort((a, b) => b.scoreFinal - a.scoreFinal).slice(0, 5);
  }, [riscos, stakeholders, registros]);

  const getNivelConfig = (nivel) => {
    const config = {
      baixo: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: '🟢' },
      medio: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '🟡' },
      alto: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🟠' },
      critico: { color: 'bg-red-100 text-red-700 border-red-300', icon: '🔴' }
    };
    return config[nivel] || config.medio;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-orange-600" />
          Temperatura Territorial
          <Badge variant="secondary">{comunidadesData.length} comunidades</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comunidadesData.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            Dados insuficientes para análise territorial
          </p>
        ) : (
          <div className="space-y-3">
            {comunidadesData.map((item, idx) => {
              const config = getNivelConfig(item.nivel);
              return (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border-2 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h4 className="font-medium text-slate-900">{item.comunidade}</h4>
                        <Badge className={config.color} variant="outline">
                          Nível: {item.nivel}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">{item.scoreFinal}</div>
                      <div className="text-xs text-slate-500">Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-white rounded">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="font-medium text-slate-900">{item.riscosAltos}</div>
                        <div className="text-xs text-slate-500">Riscos altos</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-white rounded">
                      <Users className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-slate-900">{item.stakeholders}</div>
                        <div className="text-xs text-slate-500">Stakeholders</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white rounded">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-medium text-slate-900">{item.mediaEngajamento}</div>
                        <div className="text-xs text-slate-500">Engajamento médio</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white rounded">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="font-medium text-slate-900">{item.temperaturaMedia}</div>
                        <div className="text-xs text-slate-500">Temp. média</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}