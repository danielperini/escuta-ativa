import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield, MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";
import FormularioMacrotema from './FormularioMacrotema';
import DetalhesMacrotema from './DetalhesMacrotema';

const COR_CONFIG = {
  critico: { 
    emoji: '🔴',
    label: 'Crítico', 
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
    desc: 'Alto impacto + alta presença + percepção negativa'
  },
  medio: { 
    emoji: '🟡',
    label: 'Médio', 
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    desc: 'Impacto ou presença média / percepção neutra'
  },
  positivo: { 
    emoji: '🟢',
    label: 'Positivo', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    desc: 'Baixo impacto + boa percepção comunitária'
  },
  ausente: { 
    emoji: '⚪',
    label: 'Ausente', 
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-600',
    desc: 'Tema ausente ou não aplicável'
  }
};

const RISCO_CONFIG = {
  baixo: { label: 'Baixo', color: 'bg-emerald-100 text-emerald-800', icon: '✓' },
  medio: { label: 'Médio', color: 'bg-amber-100 text-amber-800', icon: '!' },
  alto: { label: 'Alto', color: 'bg-red-100 text-red-800', icon: '⚠' }
};

export default function MatrizMacrotemas() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTema, setEditingTema] = useState(null);
  const [viewingTema, setViewingTema] = useState(null);
  const [filtroLocalidade, setFiltroLocalidade] = useState('todas');
  const [filtroCor, setFiltroCor] = useState('todas');
  const [filtroRisco, setFiltroRisco] = useState('todos');

  const { data: macrotemas = [], isLoading } = useQuery({
    queryKey: ['macrotemas'],
    queryFn: () => base44.entities.Macrotema.list('-risco_social_calculado')
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-macro'],
    queryFn: () => base44.entities.Stakeholder.list()
  });

  const localidades = useMemo(() => {
    const locs = new Set();
    macrotemas.forEach(m => m.localidades?.forEach(l => locs.add(l)));
    return Array.from(locs).sort();
  }, [macrotemas]);

  const temasFiltrados = useMemo(() => {
    return macrotemas.filter(t => {
      const matchLoc = filtroLocalidade === 'todas' || t.localidades?.includes(filtroLocalidade);
      const matchCor = filtroCor === 'todas' || t.classificacao_cor === filtroCor;
      const matchRisco = filtroRisco === 'todos' || t.categoria_risco === filtroRisco;
      return matchLoc && matchCor && matchRisco;
    });
  }, [macrotemas, filtroLocalidade, filtroCor, filtroRisco]);

  const estatisticas = useMemo(() => {
    return {
      criticos: macrotemas.filter(t => t.classificacao_cor === 'critico').length,
      medios: macrotemas.filter(t => t.classificacao_cor === 'medio').length,
      positivos: macrotemas.filter(t => t.classificacao_cor === 'positivo').length,
      riscoAlto: macrotemas.filter(t => t.categoria_risco === 'alto').length,
      riscoMedio: macrotemas.filter(t => t.categoria_risco === 'medio').length
    };
  }, [macrotemas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Matriz de Materialidade - Macrotemas</h2>
          <p className="text-slate-500">Análise ESG com drives de avaliação e risco social</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#E31E24] hover:bg-[#B01419]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Macrotema
        </Button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-700">{estatisticas.criticos}</div>
            <div className="text-xs text-red-600">🔴 Críticos</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-700">{estatisticas.medios}</div>
            <div className="text-xs text-amber-600">🟡 Médios</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-700">{estatisticas.positivos}</div>
            <div className="text-xs text-emerald-600">🟢 Positivos</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-700">{estatisticas.riscoAlto}</div>
            <div className="text-xs text-orange-600">Alto Risco</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{estatisticas.riscoMedio}</div>
            <div className="text-xs text-blue-600">Médio Risco</div>
          </CardContent>
        </Card>
      </div>

      {/* Legenda */}
      <Card className="p-4 bg-gradient-to-r from-slate-50 to-white">
        <div className="space-y-2">
          <div className="font-semibold text-slate-700 mb-2">Classificação de Materialidade:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(COR_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-slate-500">{config.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select 
          className="px-3 py-2 border rounded-lg text-sm"
          value={filtroLocalidade}
          onChange={(e) => setFiltroLocalidade(e.target.value)}
        >
          <option value="todas">Todas Localidades</option>
          {localidades.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        
        <select 
          className="px-3 py-2 border rounded-lg text-sm"
          value={filtroCor}
          onChange={(e) => setFiltroCor(e.target.value)}
        >
          <option value="todas">Todas Cores</option>
          <option value="critico">🔴 Crítico</option>
          <option value="medio">🟡 Médio</option>
          <option value="positivo">🟢 Positivo</option>
          <option value="ausente">⚪ Ausente</option>
        </select>

        <select 
          className="px-3 py-2 border rounded-lg text-sm"
          value={filtroRisco}
          onChange={(e) => setFiltroRisco(e.target.value)}
        >
          <option value="todos">Todos os Riscos</option>
          <option value="alto">Alto Risco</option>
          <option value="medio">Médio Risco</option>
          <option value="baixo">Baixo Risco</option>
        </select>
      </div>

      {/* Grid de Macrotemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {temasFiltrados.map(tema => {
          const cor = COR_CONFIG[tema.classificacao_cor] || COR_CONFIG.medio;
          const risco = RISCO_CONFIG[tema.categoria_risco] || RISCO_CONFIG.medio;

          return (
            <Card 
              key={tema.id} 
              className={cn(
                "border-2 hover:shadow-lg transition-all cursor-pointer",
                cor.bg,
                cor.border
              )}
              onClick={() => setViewingTema(tema)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{cor.emoji}</span>
                    <span className={cor.text}>{tema.nome}</span>
                  </CardTitle>
                </div>
                <Badge className={risco.color}>
                  <Shield className="w-3 h-3 mr-1" />
                  Risco {risco.label} ({tema.risco_social_calculado || 0})
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Indicadores */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-white/50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{tema.nivel_impacto}</div>
                    <div className="text-slate-600">Impacto</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{tema.nivel_presenca}</div>
                    <div className="text-slate-600">Presença</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 rounded border border-slate-200">
                    <div className="font-bold text-slate-900">{tema.percepcao_comunidade}</div>
                    <div className="text-slate-600">Percepção</div>
                  </div>
                </div>

                {/* Localidades */}
                {tema.localidades && tema.localidades.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tema.localidades.slice(0, 2).map((loc, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {loc}
                      </Badge>
                    ))}
                    {tema.localidades.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tema.localidades.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stakeholders */}
                {tema.stakeholders_relacionados && tema.stakeholders_relacionados.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Users className="w-3 h-3" />
                    {tema.stakeholders_relacionados.length} stakeholder(s)
                  </div>
                )}

                {/* Observações curtas */}
                {tema.observacoes_qualitativas && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {tema.observacoes_qualitativas}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {temasFiltrados.length === 0 && (
        <Card className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhum macrotema encontrado com os filtros selecionados</p>
        </Card>
      )}

      {/* Dialog Formulário */}
      <FormularioMacrotema
        open={showForm}
        onOpenChange={setShowForm}
        tema={editingTema}
        onSuccess={() => {
          setShowForm(false);
          setEditingTema(null);
        }}
      />

      {/* Dialog Detalhes */}
      <DetalhesMacrotema
        tema={viewingTema}
        open={!!viewingTema}
        onOpenChange={(open) => !open && setViewingTema(null)}
        onEdit={(tema) => {
          setViewingTema(null);
          setEditingTema(tema);
          setShowForm(true);
        }}
      />
    </div>
  );
}