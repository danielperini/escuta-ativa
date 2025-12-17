import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WidgetStakeholdersRiscos() {
  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-stakeholders-integracao'],
    queryFn: () => base44.entities.RiscoSocial.filter({ status: 'ativo' })
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-riscos-integracao'],
    queryFn: () => base44.entities.Stakeholder.list('-score_engajamento', 200)
  });

  // Integrar riscos com stakeholders
  const integracaoData = React.useMemo(() => {
    const resultado = [];

    riscos.forEach(risco => {
      // Encontrar stakeholders que podem ajudar ou são afetados
      const stakeholdersRelacionados = stakeholders.filter(s => {
        // Por comunidade
        if (s.comunidade === risco.comunidade) return true;
        
        // Por riscos vinculados
        if (s.riscos_vinculados?.includes(risco.id)) return true;
        
        // Por áreas de interesse que se sobrepõem aos temas do risco
        if (risco.causas?.some(causa => s.areas_interesse?.includes(causa))) return true;

        return false;
      });

      const stakeholdersPotenciais = stakeholdersRelacionados
        .filter(s => (s.score_engajamento || 0) > 50)
        .sort((a, b) => (b.score_engajamento || 0) - (a.score_engajamento || 0));

      const stakeholdersAfetados = stakeholdersRelacionados
        .filter(s => s.riscos_vinculados?.includes(risco.id));

      if (stakeholdersRelacionados.length > 0) {
        resultado.push({
          risco,
          stakeholdersPotenciais: stakeholdersPotenciais.slice(0, 3),
          stakeholdersAfetados: stakeholdersAfetados.slice(0, 3),
          totalRelacionados: stakeholdersRelacionados.length,
          scoreEngajamentoMedio: Math.round(
            stakeholdersRelacionados.reduce((acc, s) => acc + (s.score_engajamento || 0), 0) / 
            stakeholdersRelacionados.length
          )
        });
      }
    });

    return resultado.sort((a, b) => {
      // Priorizar riscos críticos com alto engajamento
      const scoreA = (a.risco.nivel === 'critico' ? 100 : a.risco.nivel === 'alto' ? 50 : 0) + 
                     (a.scoreEngajamentoMedio * 0.5);
      const scoreB = (b.risco.nivel === 'critico' ? 100 : b.risco.nivel === 'alto' ? 50 : 0) + 
                     (b.scoreEngajamentoMedio * 0.5);
      return scoreB - scoreA;
    }).slice(0, 5);
  }, [riscos, stakeholders]);

  const getNivelConfig = (nivel) => {
    const config = {
      baixo: { color: 'bg-blue-100 text-blue-700', icon: '🟢' },
      moderado: { color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
      alto: { color: 'bg-orange-100 text-orange-700', icon: '🟠' },
      critico: { color: 'bg-red-100 text-red-700', icon: '🔴' }
    };
    return config[nivel] || config.moderado;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Stakeholders × Riscos
          <Badge variant="secondary">{integracaoData.length} integrados</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {integracaoData.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            Nenhuma integração entre stakeholders e riscos identificada
          </p>
        ) : (
          <div className="space-y-4">
            {integracaoData.map((item, idx) => {
              const nivelConfig = getNivelConfig(item.risco.nivel);
              
              return (
                <div key={idx} className="p-4 rounded-lg border-2 bg-slate-50">
                  {/* Cabeçalho do Risco */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xl">{nivelConfig.icon}</span>
                      <div>
                        <Link to={createPageUrl('Analise') + '?tab=riscos&id=' + item.risco.id}>
                          <h4 className="font-medium text-slate-900 hover:text-blue-600">{item.risco.titulo}</h4>
                        </Link>
                        <p className="text-xs text-slate-500">{item.risco.comunidade}</p>
                      </div>
                    </div>
                    <Badge className={nivelConfig.color}>{item.risco.nivel}</Badge>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 bg-white rounded text-center">
                      <Users className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-lg font-bold text-slate-900">{item.totalRelacionados}</div>
                      <div className="text-xs text-slate-500">Relacionados</div>
                    </div>
                    <div className="p-2 bg-white rounded text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <div className="text-lg font-bold text-slate-900">{item.scoreEngajamentoMedio}</div>
                      <div className="text-xs text-slate-500">Engaj. médio</div>
                    </div>
                    <div className="p-2 bg-white rounded text-center">
                      <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <div className="text-lg font-bold text-slate-900">{item.stakeholdersAfetados.length}</div>
                      <div className="text-xs text-slate-500">Afetados</div>
                    </div>
                  </div>

                  {/* Stakeholders que podem ajudar */}
                  {item.stakeholdersPotenciais.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Podem ajudar na mitigação:
                      </div>
                      <div className="space-y-1">
                        {item.stakeholdersPotenciais.map((s, sidx) => (
                          <Link key={sidx} to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}>
                            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-medium">
                                  {s.nome[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-slate-900">{s.nome}</span>
                              </div>
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                {s.score_engajamento || 0} pts
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stakeholders afetados */}
                  {item.stakeholdersAfetados.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Diretamente afetados:
                      </div>
                      <div className="space-y-1">
                        {item.stakeholdersAfetados.map((s, sidx) => (
                          <Link key={sidx} to={createPageUrl('PerfilStakeholder') + `?id=${s.id}`}>
                            <div className="flex items-center justify-between p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-medium">
                                  {s.nome[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-slate-900">{s.nome}</span>
                              </div>
                              <Badge className="bg-orange-100 text-orange-700 text-xs">
                                {s.score_engajamento || 0} pts
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}