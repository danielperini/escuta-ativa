import React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Users, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

const COR_CONFIG = {
  critico: { emoji: '🔴', label: 'Crítico', bg: 'bg-red-50', text: 'text-red-900' },
  medio: { emoji: '🟡', label: 'Médio', bg: 'bg-amber-50', text: 'text-amber-900' },
  positivo: { emoji: '🟢', label: 'Positivo', bg: 'bg-emerald-50', text: 'text-emerald-900' },
  ausente: { emoji: '⚪', label: 'Ausente', bg: 'bg-slate-50', text: 'text-slate-600' }
};

const RISCO_CONFIG = {
  baixo: { label: 'Baixo', color: 'bg-emerald-100 text-emerald-800' },
  medio: { label: 'Médio', color: 'bg-amber-100 text-amber-800' },
  alto: { label: 'Alto', color: 'bg-red-100 text-red-800' }
};

export default function DetalhesMacrotema({ tema, open, onOpenChange, onEdit }) {
  const queryClient = useQueryClient();

  const { data: stakeholders = [] } = useQuery({
    queryKey: ['stakeholders-tema', tema?.id],
    queryFn: () => {
      if (!tema?.stakeholders_relacionados?.length) return [];
      return base44.entities.Stakeholder.filter({
        id: { $in: tema.stakeholders_relacionados }
      });
    },
    enabled: !!tema?.stakeholders_relacionados?.length
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Macrotema.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macrotemas'] });
      onOpenChange(false);
    }
  });

  if (!tema) return null;

  const cor = COR_CONFIG[tema.classificacao_cor] || COR_CONFIG.medio;
  const risco = RISCO_CONFIG[tema.categoria_risco] || RISCO_CONFIG.medio;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-3xl">{cor.emoji}</span>
              <span>{tema.nome}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(tema)}>
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => deleteMutation.mutate(tema.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Classificação */}
          <div className="flex gap-2">
            <Badge className={cn("text-sm", cor.bg, cor.text)}>
              {cor.emoji} {cor.label}
            </Badge>
            <Badge className={risco.color}>
              <Shield className="w-3 h-3 mr-1" />
              Risco {risco.label}
            </Badge>
            {tema.categoria && (
              <Badge variant="secondary">
                {tema.categoria === 'ambiental' && '🌿 Ambiental'}
                {tema.categoria === 'social' && '🤝 Social'}
                {tema.categoria === 'governanca' && '⚖️ Governança'}
              </Badge>
            )}
          </div>

          {/* Critérios de Materialidade */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Critérios de Materialidade</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-900">{tema.nivel_impacto}</div>
                <div className="text-sm text-slate-600 mt-1">Nível de Impacto</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-900">{tema.nivel_presenca}</div>
                <div className="text-sm text-slate-600 mt-1">Nível de Presença</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-3xl font-bold text-slate-900">{tema.percepcao_comunidade}</div>
                <div className="text-sm text-slate-600 mt-1">Percepção Comunidade</div>
              </div>
            </div>
          </Card>

          {/* Índice de Risco Social */}
          <Card className="p-4 bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Índice de Risco Social
              </h3>
              <Badge className={risco.color}>
                {tema.risco_social_calculado || 0}/100
              </Badge>
            </div>
            <div className="w-full bg-white rounded-full h-4 mb-4">
              <div 
                className={cn("h-4 rounded-full transition-all",
                  tema.categoria_risco === 'alto' ? 'bg-red-600' :
                  tema.categoria_risco === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${tema.risco_social_calculado || 0}%` }}
              />
            </div>
            
            {tema.drives_avaliacao && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Impacto Cotidiano:</span>
                  <strong>{tema.drives_avaliacao.impacto_cotidiano || 0}/5</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Clima Diálogo:</span>
                  <strong>{tema.drives_avaliacao.clima_dialogo || 0}/5</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Influência Stakeholders:</span>
                  <strong>{tema.drives_avaliacao.influencia_stakeholders || 0}/5</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Presença Equipes:</span>
                  <strong>{tema.drives_avaliacao.presenca_equipes || 0}/5</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Incidência Protestos:</span>
                  <strong>{tema.drives_avaliacao.incidencia_protestos || 0}/5</strong>
                </div>
                <div className="flex justify-between p-2 bg-white rounded">
                  <span>Confiança/Reputação:</span>
                  <strong>{tema.drives_avaliacao.confianca_reputacao || 0}/5</strong>
                </div>
              </div>
            )}
          </Card>

          {/* Observações Qualitativas */}
          {tema.observacoes_qualitativas && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Observações Qualitativas</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {tema.observacoes_qualitativas}
              </p>
            </Card>
          )}

          {/* Localidades */}
          {tema.localidades && tema.localidades.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localidades Afetadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {tema.localidades.map((loc, idx) => (
                  <Badge key={idx} variant="secondary">
                    {loc}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Stakeholders Relacionados */}
          {stakeholders.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Stakeholders Relacionados ({stakeholders.length})
              </h3>
              <div className="space-y-2">
                {stakeholders.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm font-medium">{s.nome}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{s.comunidade}</Badge>
                      {s.tipo && <Badge variant="outline" className="text-xs">{s.tipo}</Badge>}
                    </div>
                  </div>
                ))}
                {stakeholders.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{stakeholders.length - 5} stakeholder(s)
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Ações Sugeridas */}
          {tema.acoes_sugeridas && tema.acoes_sugeridas.length > 0 && (
            <Card className="p-4 bg-amber-50">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Ações Sugeridas
              </h3>
              <ul className="space-y-2">
                {tema.acoes_sugeridas.map((acao, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}