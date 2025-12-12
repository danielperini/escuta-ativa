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

  const { data: casos = [] } = useQuery({
    queryKey: ['casos-liderancas'],
    queryFn: () => base44.entities.Caso.list()
  });

  // Calcular citações e relevância de stakeholders
  const stakeholdersComCitacoes = stakeholders.map(stakeholder => {
    // 1. Contar citações nos registros
    const citacoes = registros.filter(r => 
      r.participantes?.includes(stakeholder.nome) ||
      r.stakeholders_vinculados?.includes(stakeholder.id) ||
      r.liderancas_vinculadas?.includes(stakeholder.id)
    ).length;

    // 2. Identificar temas críticos (alta urgência/temperatura)
    const temasCriticos = new Set();
    const temasAltaPrioridade = new Set();
    
    registros.forEach(r => {
      const estaVinculado = r.participantes?.includes(stakeholder.nome) ||
                           r.stakeholders_vinculados?.includes(stakeholder.id);
      
      if (estaVinculado) {
        // Temas críticos (temperatura alta)
        if (r.temperatura_territorio === 'alto' || r.temperatura_territorio === 'critico') {
          (r.temas_identificados || []).forEach(tema => temasCriticos.add(tema));
        }
        
        // Temas de alta prioridade (demandas urgentes)
        (r.demandas || []).forEach(d => {
          if (d.urgencia === 'critica' || d.urgencia === 'alta') {
            (r.temas_identificados || []).forEach(tema => {
              temasCriticos.add(tema);
              temasAltaPrioridade.add(tema);
            });
          }
        });
      }
    });

    // 3. Engajamento em temas prioritários do sistema
    const temasPrioritarios = temas.filter(t => t.prioritario === true);
    const engajamentoTemasChave = temasPrioritarios.filter(t => 
      stakeholder.temas_recorrentes?.includes(t.nome)
    ).length;

    // 4. Participação ativa em casos relevantes
    const casosRelevantes = casos.filter(c => 
      c.stakeholders_envolvidos?.includes(stakeholder.id) &&
      (c.prioridade === 'alta' || c.prioridade === 'urgente') &&
      c.status !== 'cancelado'
    );
    const participacaoCasosRelevantes = casosRelevantes.length;

    // 5. Score de feedback (da entidade Stakeholder)
    const feedbackScore = stakeholder.feedbacks_recebidos?.length || 0;
    const feedbackPositivo = (stakeholder.feedbacks_recebidos || []).filter(f => 
      f.tipo === 'positivo' || f.descricao?.toLowerCase().includes('liderança')
    ).length;

    // 6. Engajamento em temas críticos (campo da entidade)
    const engajamentoCriticoSalvo = stakeholder.engajamento_temas_criticos || 0;

    // CÁLCULO DO SCORE REFINADO:
    // - Citações base: 1 ponto cada
    // - Temas críticos: 3 pontos cada
    // - Temas alta prioridade: 2 pontos cada
    // - Engajamento em temas-chave do sistema: 4 pontos cada
    // - Participação em casos relevantes: 5 pontos cada
    // - Feedback positivo: 3 pontos cada
    // - Score de engajamento salvo: valor direto
    const score = 
      (citacoes * 1) +
      (temasCriticos.size * 3) +
      (temasAltaPrioridade.size * 2) +
      (engajamentoTemasChave * 4) +
      (participacaoCasosRelevantes * 5) +
      (feedbackPositivo * 3) +
      (engajamentoCriticoSalvo);

    // Critério de emergência refinado
    const emergente = (
      citacoes >= 3 && 
      (temasCriticos.size > 0 || participacaoCasosRelevantes > 0 || feedbackPositivo > 0)
    );

    return {
      ...stakeholder,
      citacoes,
      temasCriticos: Array.from(temasCriticos),
      engajamentoTemasChave,
      participacaoCasosRelevantes,
      feedbackPositivo,
      casosRelevantes,
      score,
      emergente,
      detalhesScore: {
        citacoes: citacoes * 1,
        temasCriticos: temasCriticos.size * 3,
        temasAltaPrioridade: temasAltaPrioridade.size * 2,
        engajamentoChave: engajamentoTemasChave * 4,
        casosRelevantes: participacaoCasosRelevantes * 5,
        feedbacks: feedbackPositivo * 3,
        engajamentoCritico: engajamentoCriticoSalvo
      }
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
            <p className="text-sm text-amber-900 mb-2">
              <strong>Algoritmo de Pontuação:</strong> Score calculado com base em múltiplos fatores:
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• <strong>Citações</strong> nos registros (1 pt cada)</li>
              <li>• <strong>Temas críticos</strong> - alta temperatura (3 pts cada)</li>
              <li>• <strong>Temas alta prioridade</strong> - demandas urgentes (2 pts cada)</li>
              <li>• <strong>Engajamento em temas-chave</strong> do sistema (4 pts cada)</li>
              <li>• <strong>Participação em casos relevantes</strong> (5 pts cada)</li>
              <li>• <strong>Feedback positivo</strong> de stakeholders (3 pts cada)</li>
            </ul>
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
                        <span className="text-slate-600">citações ({stakeholder.detalhesScore.citacoes} pts)</span>
                      </div>

                      {stakeholder.temasCriticos.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-slate-700">
                              Temas críticos ({stakeholder.detalhesScore.temasCriticos} pts):
                            </span>
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

                      {stakeholder.engajamentoTemasChave > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{stakeholder.engajamentoTemasChave}</span>
                          <span className="text-slate-600">temas-chave ({stakeholder.detalhesScore.engajamentoChave} pts)</span>
                        </div>
                      )}

                      {stakeholder.participacaoCasosRelevantes > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">{stakeholder.participacaoCasosRelevantes}</span>
                          <span className="text-slate-600">casos relevantes ({stakeholder.detalhesScore.casosRelevantes} pts)</span>
                        </div>
                      )}

                      {stakeholder.feedbackPositivo > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">{stakeholder.feedbackPositivo}</span>
                          <span className="text-slate-600">feedbacks positivos ({stakeholder.detalhesScore.feedbacks} pts)</span>
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