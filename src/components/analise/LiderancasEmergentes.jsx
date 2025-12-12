import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle, Award, Flame } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LiderancasEmergentes() {
  const [filterComunidade, setFilterComunidade] = useState('todos');
  const [filterTema, setFilterTema] = useState('todos');

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-liderancas'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-liderancas'],
    queryFn: () => base44.entities.Registro.list('-created_date', 500)
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: temas = [] } = useQuery({
    queryKey: ['temas'],
    queryFn: () => base44.entities.Tema.list()
  });

  // Calcular citações e relevância de stakeholders
  const stakeholdersComCitacoes = stakeholders.map(stakeholder => {
    // Contar citações nos registros
    const citacoes = registros.filter(r => 
      r.participantes?.includes(stakeholder.nome) ||
      r.stakeholders_vinculados?.includes(stakeholder.id) ||
      r.liderancas_vinculadas?.includes(stakeholder.id)
    ).length;

    // Identificar temas críticos (alta urgência/temperatura)
    const temasCriticos = new Set();
    registros.forEach(r => {
      const estaVinculado = r.participantes?.includes(stakeholder.nome) ||
                           r.stakeholders_vinculados?.includes(stakeholder.id);
      
      if (estaVinculado) {
        if (r.temperatura_territorio === 'alto' || r.temperatura_territorio === 'critico') {
          (r.temas_identificados || []).forEach(tema => temasCriticos.add(tema));
        }
        
        // Verificar demandas críticas/urgentes
        (r.demandas || []).forEach(d => {
          if (d.urgencia === 'critica' || d.urgencia === 'alta') {
            (r.temas_identificados || []).forEach(tema => temasCriticos.add(tema));
          }
        });
      }
    });

    // Score: citações + (temas críticos * 2)
    const score = citacoes + (temasCriticos.size * 2);

    return {
      ...stakeholder,
      citacoes,
      temasCriticos: Array.from(temasCriticos),
      score,
      emergente: citacoes >= 3 && temasCriticos.size > 0
    };
  });

  // Filtrar e ordenar
  const stakeholdersFiltrados = stakeholdersComCitacoes
    .filter(s => {
      const matchComunidade = filterComunidade === 'todos' || s.comunidade === filterComunidade;
      const matchTema = filterTema === 'todos' || s.temasCriticos.includes(filterTema);
      return matchComunidade && matchTema && s.emergente;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Lideranças Emergentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-900">
              <strong>Critério:</strong> Lideranças emergentes são identificadas com base no <strong>número de citações</strong> nos registros
              e sua <strong>vinculação a temas críticos</strong> (alta temperatura territorial ou demandas urgentes).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Filtrar por Comunidade</Label>
              <Select value={filterComunidade} onValueChange={setFilterComunidade}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {comunidades.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filtrar por Tema</Label>
              <Select value={filterTema} onValueChange={setFilterTema}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {temas.map(t => (
                    <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {stakeholdersFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma liderança emergente identificada</h3>
            <p className="text-slate-500">
              Continue registrando interações para identificar lideranças relevantes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakeholdersFiltrados.map((stakeholder, index) => (
            <Card key={stakeholder.id} className="hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                    index < 3 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-[#2D6A4F]'
                  }`}>
                    {index < 3 ? <Award className="w-6 h-6" /> : stakeholder.nome?.[0]?.toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{stakeholder.nome}</h3>
                      <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 flex-shrink-0">
                        <Flame className="w-3 h-3" />
                        Score: {stakeholder.score}
                      </Badge>
                    </div>

                    {stakeholder.papel_social && (
                      <p className="text-sm text-slate-600 mb-2">{stakeholder.papel_social}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span>{stakeholder.comunidade}</span>
                      {stakeholder.organizacao && (
                        <>
                          <span>•</span>
                          <span>{stakeholder.organizacao}</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{stakeholder.citacoes}</span>
                        <span className="text-slate-600">citações nos registros</span>
                      </div>

                      {stakeholder.temasCriticos.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-slate-700">Vinculado a temas críticos:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {stakeholder.temasCriticos.slice(0, 5).map((tema, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                {tema}
                              </Badge>
                            ))}
                            {stakeholder.temasCriticos.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{stakeholder.temasCriticos.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}