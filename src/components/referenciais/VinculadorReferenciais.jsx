import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { REFERENCIAIS_ESG, GRI_DETALHAMENTO, ODS_LISTA } from '@/lib/referenciais';
import { toast } from 'sonner';

/**
 * Vinculador de Referenciais ESG como evidências.
 * Embutido em registros/interações para classificar atividades reais de
 * relacionamento comunitário em referenciais rastreáveis.
 */
export default function VinculadorReferenciais({
  entidadeTipo,
  entidadeId,
  entidadeNome,
  comunidade,
  territorio,
}) {
  const queryClient = useQueryClient();
  const [ref, setRef] = useState('');
  const [sub, setSub] = useState('');
  const [obs, setObs] = useState('');

  const queryKey = ['ref-evidencias', entidadeTipo, entidadeId];

  const { data: evidencias = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () =>
      base44.entities.ReferencialEvidencia.filter(
        { entidade_tipo: entidadeTipo, entidade_id: entidadeId },
        '-created_date',
        200
      ),
    enabled: !!entidadeId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['referenciais-esg-dashboard'] });
  };

  const criar = useMutation({
    mutationFn: async (d) => base44.entities.ReferencialEvidencia.create(d),
    onSuccess: () => {
      invalidateAll();
      toast.success('Referencial vinculado como evidência.');
      setRef('');
      setSub('');
      setObs('');
    },
    onError: () => toast.error('Erro ao vincular referencial'),
  });

  const remover = useMutation({
    mutationFn: async (id) => base44.entities.ReferencialEvidencia.delete(id),
    onSuccess: invalidateAll,
  });

  const handleAdd = () => {
    if (!ref) {
      toast.error('Selecione um referencial');
      return;
    }
    if (!entidadeId) {
      toast.error('Salve o registro antes de vincular um referencial');
      return;
    }
    criar.mutate({
      referencial: ref,
      sub_referencial: sub || '',
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      entidade_nome: entidadeNome || '',
      comunidade: comunidade || '',
      territorio: territorio || '',
      observacoes: obs,
      status: 'validado',
      origem: 'usuario',
    });
  };

  const subLabel = ref === 'GRI'
    ? 'Detalhamento GRI'
    : ref === 'ODS'
      ? 'ODS'
      : 'Sub-referencial (opcional)';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Referenciais e Compromissos ESG
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Transforme este registro em <strong>evidência</strong> vinculada a referenciais de
          relacionamento comunitário, engajamento de stakeholders e direitos humanos.
        </p>

        {/* Lista de vínculos */}
        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : evidencias.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum referencial vinculado a este registro ainda.</p>
        ) : (
          <div className="space-y-2">
            {evidencias.map((ev) => (
              <div key={ev.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-emerald-100 text-emerald-700">{ev.referencial}</Badge>
                    {ev.sub_referencial && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300">{ev.sub_referencial}</Badge>
                    )}
                    {ev.status === 'sugerido' ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        <Sparkles className="w-3 h-3 mr-1" />Sugestão da IA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        <ShieldCheck className="w-3 h-3 mr-1" />Validado pelo usuário
                      </Badge>
                    )}
                  </div>
                  {ev.observacoes && <p className="text-xs text-slate-600 mt-1">{ev.observacoes}</p>}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remover.mutate(ev.id)}
                  disabled={remover.isPending}
                  title="Remover vínculo"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulário de vínculo */}
        <div className="border-t pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Referencial</label>
              <Select value={ref} onValueChange={setRef}>
                <SelectTrigger><SelectValue placeholder="Selecione um referencial" /></SelectTrigger>
                <SelectContent>
                  {REFERENCIAIS_ESG.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{subLabel}</label>
              {ref === 'GRI' ? (
                <Select value={sub} onValueChange={setSub}>
                  <SelectTrigger><SelectValue placeholder="Selecione o detalhamento" /></SelectTrigger>
                  <SelectContent>
                    {GRI_DETALHAMENTO.map((g) => (
                      <SelectItem key={g.codigo} value={g.codigo}>{g.codigo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : ref === 'ODS' ? (
                <Select value={sub} onValueChange={setSub}>
                  <SelectTrigger><SelectValue placeholder="Selecione o ODS" /></SelectTrigger>
                  <SelectContent>
                    {ODS_LISTA.map((o) => (
                      <SelectItem key={o.id} value={`ODS ${o.id}`}>ODS {o.id} — {o.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={sub}
                  onChange={(e) => setSub(e.target.value)}
                  placeholder="Código / sub-referencial (opcional)"
                />
              )}
            </div>
          </div>
          <Textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observações sobre a relação entre este registro e o referencial (opcional)"
            rows={2}
          />
          <Button onClick={handleAdd} disabled={criar.isPending} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {criar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Vincular como evidência
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}