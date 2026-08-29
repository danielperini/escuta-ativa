import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Save, Map } from 'lucide-react';
import { toast } from 'sonner';

const PERIODICIDADES = ['Mensal', 'Bimestral', 'Trimestral', 'Quadrimestral', 'Semestral', 'Anual', 'Contínuo'];

export default function AbaEstrategia({ configuracao }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    estrategia_esg: '', objetivos_grupo: '',
    publicos_prioritarios: [], territorios_prioritarios: [],
    temas_prioritarios: [], canais_relacionamento: [],
    periodicidade_relacionamento: ''
  });
  const [inputs, setInputs] = useState({ publicos: '', territorios: '', temas: '', canais: '' });

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-operacionais'],
    queryFn: () => base44.entities.UnidadeOperacional.list('-created_date', 500),
    enabled: !!configuracao
  });

  const [unidadeSel, setUnidadeSel] = useState('');
  const [estrategiaUnidade, setEstrategiaUnidade] = useState(null);

  useEffect(() => {
    if (configuracao) {
      setForm({
        estrategia_esg: configuracao.estrategia_esg || '',
        objetivos_grupo: configuracao.objetivos_grupo || '',
        publicos_prioritarios: configuracao.publicos_prioritarios || [],
        territorios_prioritarios: configuracao.territorios_prioritarios || [],
        temas_prioritarios: configuracao.temas_prioritarios || [],
        canais_relacionamento: configuracao.canais_relacionamento || [],
        periodicidade_relacionamento: configuracao.periodicidade_relacionamento || ''
      });
    }
  }, [configuracao]);

  useEffect(() => {
    if (unidadeSel) {
      const u = unidades.find(u => u.id === unidadeSel);
      setEstrategiaUnidade(u?.estrategia_unidade || {
        diretrizes: '', objetivos: '', publicos_prioritarios: [],
        territorios_prioritarios: [], temas_prioritarios: [],
        canais_relacionamento: [], periodicidade_relacionamento: '',
        responsaveis_ids: []
      });
    } else {
      setEstrategiaUnidade(null);
    }
  }, [unidadeSel, unidades]);

  const salvarGrupo = useMutation({
    mutationFn: async (data) => base44.entities.ConfiguracaoESG.update(configuracao.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuracao-esg'] }); toast.success('Estratégia do grupo salva'); },
    onError: () => toast.error('Erro ao salvar estratégia do grupo')
  });

  const salvarUnidade = useMutation({
    mutationFn: async (id, data) => base44.entities.UnidadeOperacional.update(id, { estrategia_unidade: data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] }); toast.success('Estratégia da unidade salva'); },
    onError: () => toast.error('Erro ao salvar estratégia da unidade')
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const addChipG = (k, value, inputK) => {
    if (!value.trim()) return;
    if ((form[k] || []).includes(value.trim())) return;
    set(k, [...(form[k] || []), value.trim()]);
    setInputs(i => ({ ...i, [inputK]: '' }));
  };
  const removeChipG = (k, v) => set(k, (form[k] || []).filter(i => i !== v));
  const setU = (k, v) => setEstrategiaUnidade(prev => ({ ...(prev || {}), [k]: v }));
  const addChipU = (k, value, inputK) => {
    if (!value.trim()) return;
    if ((estrategiaUnidade?.[k] || []).includes(value.trim())) return;
    setU(k, [...(estrategiaUnidade?.[k] || []), value.trim()]);
    setInputs(i => ({ ...i, [inputK]: '' }));
  };
  const removeChipU = (k, v) => setU(k, (estrategiaUnidade?.[k] || []).filter(i => i !== v));

  const Chips = ({ items, k, label, input, inputK, onAdd, onRemove }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInputs(i => ({ ...i, [inputK]: e.target.value }))} placeholder={`Digite e clique em adicionar`} />
        <Button type="button" variant="outline" onClick={() => onAdd(k, input, inputK)}>Adicionar</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(items || []).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
            {t}
            <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => onRemove(k, t)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Estratégia do Grupo / Organização
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Estratégia corporativa geral de relacionamento e ESG (nível 1). Estratégias específicas por unidade são configuradas abaixo.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Diretrizes de relacionamento</Label>
            <Textarea value={form.estrategia_esg} rows={4} onChange={e => set('estrategia_esg', e.target.value)}
              placeholder="Diretrizes corporativas de relacionamento comunitário, engajamento de stakeholders e gestão territorial" />
          </div>
          <div className="space-y-2">
            <Label>Objetivos</Label>
            <Textarea value={form.objetivos_grupo} rows={3} onChange={e => set('objetivos_grupo', e.target.value)} placeholder="Objetivos da estratégia corporativa" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Chips items={form.publicos_prioritarios} k="publicos_prioritarios" label="Públicos prioritários" input={inputs.publicos} inputK="publicos" onAdd={addChipG} onRemove={removeChipG} />
            <Chips items={form.territorios_prioritarios} k="territorios_prioritarios" label="Territórios prioritários" input={inputs.territorios} inputK="territorios" onAdd={addChipG} onRemove={removeChipG} />
            <Chips items={form.temas_prioritarios} k="temas_prioritarios" label="Temas prioritários" input={inputs.temas} inputK="temas" onAdd={addChipG} onRemove={removeChipG} />
            <Chips items={form.canais_relacionamento} k="canais_relacionamento" label="Canais de relacionamento" input={inputs.canais} inputK="canais" onAdd={addChipG} onRemove={removeChipG} />
          </div>
          <div className="space-y-2">
            <Label>Periodicidade de relacionamento</Label>
            <Select value={form.periodicidade_relacionamento} onValueChange={v => set('periodicidade_relacionamento', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {PERIODICIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => salvarGrupo.mutate(form)} disabled={salvarGrupo.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> {salvarGrupo.isPending ? 'Salvando...' : 'Salvar estratégia do grupo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-teal-600" />
            Estratégia de Unidade
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Defina a estratégia de relacionamento específica de uma unidade/planta/operatório. O texto da unidade complementa a estratégia do grupo, não substitui.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Selecionar unidade</Label>
            <Select value={unidadeSel} onValueChange={setUnidadeSel}>
              <SelectTrigger><SelectValue placeholder="Escolha uma unidade para editar sua estratégia" /></SelectTrigger>
              <SelectContent>
                {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {unidadeSel && estrategiaUnidade ? (
            <div className="space-y-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-2">
                <Label>Diretrizes da unidade</Label>
                <Textarea value={estrategiaUnidade.diretrizes || ''} rows={3} onChange={e => setU('diretrizes', e.target.value)} placeholder="Diretrizes específicas desta unidade" />
              </div>
              <div className="space-y-2">
                <Label>Objetivos da unidade</Label>
                <Textarea value={estrategiaUnidade.objetivos || ''} rows={3} onChange={e => setU('objetivos', e.target.value)} placeholder="Objetivos específicos desta unidade" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Chips items={estrategiaUnidade.publicos_prioritarios} k="publicos_prioritarios" label="Públicos prioritários da unidade" input={inputs.uPublicos || ''} inputK="uPublicos" onAdd={addChipU} onRemove={removeChipU} />
                <Chips items={estrategiaUnidade.territorios_prioritarios} k="territorios_prioritarios" label="Territórios prioritários da unidade" input={inputs.uTerritorios || ''} inputK="uTerritorios" onAdd={addChipU} onRemove={removeChipU} />
                <Chips items={estrategiaUnidade.temas_prioritarios} k="temas_prioritarios" label="Temas prioritários da unidade" input={inputs.uTemas || ''} inputK="uTemas" onAdd={addChipU} onRemove={removeChipU} />
                <Chips items={estrategiaUnidade.canais_relacionamento} k="canais_relacionamento" label="Canais da unidade" input={inputs.uCanais || ''} inputK="uCanais" onAdd={addChipU} onRemove={removeChipU} />
              </div>
              <div className="space-y-2">
                <Label>Periodicidade de relacionamento da unidade</Label>
                <Select value={estrategiaUnidade.periodicidade_relacionamento} onValueChange={v => setU('periodicidade_relacionamento', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PERIODICIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => salvarUnidade.mutate(unidadeSel, estrategiaUnidade)} disabled={salvarUnidade.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" /> {salvarUnidade.isPending ? 'Salvando...' : 'Salvar estratégia da unidade'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Cadastre unidades na aba "Unidades / Plantas" para definir estratégias específicas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}