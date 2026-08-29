import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Save, Shield, Target } from 'lucide-react';
import { REFERENCIAIS_ESG, GRI_DETALHAMENTO, ODS_LISTA } from '@/lib/referenciais';
import { toast } from 'sonner';

export default function AbaReferenciais({ configuracao }) {
  const queryClient = useQueryClient();
  const [grupo, setGrupo] = useState({ compromissos_publicos: [], referenciais_prioritarios: { gri_detalhamento: [], ods_prioritarios: [] } });
  const [unidadeSel, setUnidadeSel] = useState('');
  const [refUnidade, setRefUnidade] = useState({ gri_detalhamento: [], ods_prioritarios: [], compromissos_publicos: [] });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-operacionais'],
    queryFn: () => base44.entities.UnidadeOperacional.list('-created_date', 500),
    enabled: !!configuracao
  });

  useEffect(() => {
    if (configuracao) {
      const r = configuracao.referenciais_prioritarios || {};
      setGrupo({
        compromissos_publicos: configuracao.compromissos_publicos || [],
        referenciais_prioritarios: {
          gri_detalhamento: r.gri_detalhamento || [],
          ods_prioritarios: r.ods_prioritarios || []
        }
      });
    }
  }, [configuracao]);

  useEffect(() => {
    if (unidadeSel) {
      const u = unidades.find(u => u.id === unidadeSel);
      const r = u?.referenciais_unidade || {};
      setRefUnidade({
        gri_detalhamento: r.gri_detalhamento || [],
        ods_prioritarios: r.ods_prioritarios || [],
        compromissos_publicos: r.compromissos_publicos || []
      });
    } else {
      setRefUnidade({ gri_detalhamento: [], ods_prioritarios: [], compromissos_publicos: [] });
    }
  }, [unidadeSel, unidades]);

  const salvarGrupo = useMutation({
    mutationFn: async (data) => base44.entities.ConfiguracaoESG.update(configuracao.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuracao-esg'] }); toast.success('Referenciais do grupo salvos'); },
    onError: () => toast.error('Erro ao salvar referenciais do grupo')
  });

  const salvarUnidade = useMutation({
    mutationFn: async (id, data) => base44.entities.UnidadeOperacional.update(id, { referenciais_unidade: data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] }); toast.success('Referenciais da unidade salvos'); },
    onError: () => toast.error('Erro ao salvar referenciais da unidade')
  });

  const toggleGrupoRef = (id) => setGrupo(p => ({
    ...p,
    compromissos_publicos: p.compromissos_publicos.includes(id)
      ? p.compromissos_publicos.filter(c => c !== id)
      : [...p.compromissos_publicos, id]
  }));

  const toggleGrupoGRI = (codigo) => setGrupo(p => {
    const a = p.referenciais_prioritarios.gri_detalhamento;
    return {
      ...p,
      referenciais_prioritarios: {
        ...p.referenciais_prioritarios,
        gri_detalhamento: a.includes(codigo) ? a.filter(g => g !== codigo) : [...a, codigo]
      }
    };
  });

  const toggleGrupoODS = (ods) => setGrupo(p => {
    const a = p.referenciais_prioritarios.ods_prioritarios;
    return {
      ...p,
      referenciais_prioritarios: {
        ...p.referenciais_prioritarios,
        ods_prioritarios: a.includes(ods) ? a.filter(o => o !== ods) : [...a, ods]
      }
    };
  });

  const toggleURef = (id) => setRefUnidade(p => ({
    ...p,
    compromissos_publicos: p.compromissos_publicos.includes(id)
      ? p.compromissos_publicos.filter(c => c !== id)
      : [...p.compromissos_publicos, id]
  }));

  const toggleUGRI = (codigo) => setRefUnidade(p => ({
    ...p,
    gri_detalhamento: p.gri_detalhamento.includes(codigo) ? p.gri_detalhamento.filter(g => g !== codigo) : [...p.gri_detalhamento, codigo]
  }));

  const toggleUODS = (ods) => setRefUnidade(p => ({
    ...p,
    ods_prioritarios: p.ods_prioritarios.includes(ods) ? p.ods_prioritarios.filter(o => o !== ods) : [...p.ods_prioritarios, ods]
  }));

  const griSelecionadoG = grupo.compromissos_publicos.includes('GRI');
  const griSelecionadoU = refUnidade.compromissos_publicos.includes('GRI');

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Referenciais do Grupo / Organização
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Compromissos e detalhamentos adotados no nível corporativo (nível 1). Estes referenciais se aplicam ao grupo, podendo ser complementados por unidade.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REFERENCIAIS_ESG.map((ref) => (
              <div key={ref.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100" onClick={() => toggleGrupoRef(ref.id)}>
                <Checkbox checked={grupo.compromissos_publicos.includes(ref.id)} onCheckedChange={() => toggleGrupoRef(ref.id)} />
                <div>
                  <label className="text-sm font-medium text-slate-800 cursor-pointer">{ref.nome}</label>
                  <p className="text-xs text-slate-500 mt-0.5">{ref.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-base mb-1 block">GRI — Detalhamento do Grupo</Label>
            {!griSelecionadoG ? (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" /> Selecione "GRI" acima para detalhar os padrões do grupo.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GRI_DETALHAMENTO.map((g) => (
                  <div key={g.codigo} className="flex items-start gap-2 p-3 bg-emerald-50 rounded border border-emerald-100 cursor-pointer" onClick={() => toggleGrupoGRI(g.codigo)}>
                    <Checkbox checked={grupo.referenciais_prioritarios.gri_detalhamento.includes(g.codigo)} onCheckedChange={() => toggleGrupoGRI(g.codigo)} />
                    <div>
                      <label className="text-sm font-medium text-slate-800 cursor-pointer">{g.codigo}</label>
                      <p className="text-xs text-slate-600 mt-0.5">{g.nome}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{g.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-base mb-1 block">ODS Prioritários (Grupo)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ODS_LISTA.map((ods) => {
                const checked = grupo.referenciais_prioritarios.ods_prioritarios.includes(ods.id);
                return (
                  <div key={ods.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded cursor-pointer" onClick={() => toggleGrupoODS(ods.id)}>
                    <Checkbox checked={checked} onCheckedChange={() => toggleGrupoODS(ods.id)} />
                    <div>
                      <span className="text-sm font-medium text-slate-800 block leading-tight">ODS {ods.id}</span>
                      <span className="text-[11px] text-slate-600 leading-tight block">{ods.nome}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => salvarGrupo.mutate(grupo)} disabled={salvarGrupo.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> {salvarGrupo.isPending ? 'Salvando...' : 'Salvar referenciais do grupo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            Referenciais de Unidade
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Associe referenciais específicos a uma unidade. A unidade herda o nível do grupo apenas se apropriado — não há duplicação obrigatória.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Selecionar unidade</Label>
            <Select value={unidadeSel} onValueChange={setUnidadeSel}>
              <SelectTrigger><SelectValue placeholder="Escolha uma unidade" /></SelectTrigger>
              <SelectContent>
                {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {unidadeSel ? (
            <div className="space-y-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {REFERENCIAIS_ESG.map((ref) => (
                  <div key={ref.id} className="flex items-start gap-2 p-3 bg-white rounded-lg cursor-pointer hover:bg-slate-100" onClick={() => toggleURef(ref.id)}>
                    <Checkbox checked={refUnidade.compromissos_publicos.includes(ref.id)} onCheckedChange={() => toggleURef(ref.id)} />
                    <div>
                      <label className="text-sm font-medium text-slate-800 cursor-pointer">{ref.nome}</label>
                      <p className="text-xs text-slate-500 mt-0.5">{ref.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-base mb-1 block">GRI — Detalhamento da Unidade</Label>
                {!griSelecionadoU ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <Info className="w-3 h-3" /> Selecione "GRI" acima para detalhar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {GRI_DETALHAMENTO.map((g) => (
                      <div key={g.codigo} className="flex items-start gap-2 p-3 bg-emerald-50 rounded border border-emerald-100 cursor-pointer" onClick={() => toggleUGRI(g.codigo)}>
                        <Checkbox checked={refUnidade.gri_detalhamento.includes(g.codigo)} onCheckedChange={() => toggleUGRI(g.codigo)} />
                        <div>
                          <label className="text-sm font-medium text-slate-800 cursor-pointer">{g.codigo}</label>
                          <p className="text-xs text-slate-600 mt-0.5">{g.nome}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{g.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base mb-1 block">ODS Prioritários (Unidade)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ODS_LISTA.map((ods) => {
                    const checked = refUnidade.ods_prioritarios.includes(ods.id);
                    return (
                      <div key={ods.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded cursor-pointer" onClick={() => toggleUODS(ods.id)}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleUODS(ods.id)} />
                        <div>
                          <span className="text-sm font-medium text-slate-800 block leading-tight">ODS {ods.id}</span>
                          <span className="text-[11px] text-slate-600 leading-tight block">{ods.nome}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => salvarUnidade.mutate(unidadeSel, refUnidade)} disabled={salvarUnidade.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" /> {salvarUnidade.isPending ? 'Salvando...' : 'Salvar referenciais da unidade'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Selecione uma unidade para configurar referenciais específicos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}