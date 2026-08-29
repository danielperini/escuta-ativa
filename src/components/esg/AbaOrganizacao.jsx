import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Save, Upload, Globe } from 'lucide-react';
import { toast } from 'sonner';

const TIPOS_ORG = [
  'Grupo Empresarial', 'Empresa', 'Instituto', 'Fundação',
  'Organização da Sociedade Civil', 'Órgão Público', 'Prefeitura',
  'Autarquia', 'Universidade', 'Outro'
];

const SETORES_PRINCIPAIS = [
  'Mineração', 'Siderurgia', 'Cimento', 'Energia', 'Infraestrutura',
  'Saneamento', 'Transporte', 'Logística', 'Indústria', 'Construção',
  'Setor Público', 'Terceiro Setor', 'Educação', 'Saúde', 'Cultura', 'Outro'
];

const VAZIO = {
  nome_empresa: '', nome_institucional_completo: '', tipo_organizacao: 'Empresa',
  cnpj: '', setor_atuacao: '', site_institucional: '', descricao_grupo: '',
  estrategia_esg: '', objetivos_grupo: '', publicos_prioritarios: [],
  territorios_prioritarios: [], temas_prioritarios: [], canais_relacionamento: [],
  periodicidade_relacionamento: '', responsaveis_grupo: [], territorios_influencia: [],
  contato_responsavel: { nome: '', cargo: '', email: '', telefone: '' },
  metodologia_classificacao: 'Classificação automática por IA utilizando análise de palavras-chave e contexto temático',
  logo_empresa_url: ''
};

export default function AbaOrganizacao({ configuracao, isLoading }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(VAZIO);
  const [publicosInput, setPublicosInput] = useState('');
  const [canaisInput, setCanaisInput] = useState('');
  const [temasInput, setTemasInput] = useState('');
  const [territoriosInput, setTerritoriosInput] = useState('');

  useEffect(() => {
    if (configuracao) {
      const r = configuracao.referenciais_prioritarios || {};
      setForm(f => ({
        ...VAZIO,
        ...configuracao,
        publicos_prioritarios: configuracao.publicos_prioritarios || [],
        territorios_prioritarios: configuracao.territorios_prioritarios || [],
        temas_prioritarios: configuracao.temas_prioritarios || [],
        canais_relacionamento: configuracao.canais_relacionamento || [],
        responsaveis_grupo: configuracao.responsaveis_grupo || [],
        territorios_influencia: configuracao.territorios_influencia || [],
        contato_responsavel: { ...(configuracao.contato_responsavel || {}) }
      }));
    }
  }, [configuracao]);

  const salvarMutation = useMutation({
    mutationFn: async (data) => {
      if (configuracao) {
        return await base44.entities.ConfiguracaoESG.update(configuracao.id, data);
      } else {
        return await base44.entities.ConfiguracaoESG.create({ ...VAZIO, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-esg'] });
      queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] });
      toast.success('Organização salva com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar organização')
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const addToList = (k, value, input, setInput) => {
    if (!value.trim()) return;
    if ((form[k] || []).includes(value.trim())) return;
    set(k, [...(form[k] || []), value.trim()]);
    setInput('');
  };
  const removeFromList = (k, v) => set(k, (form[k] || []).filter(i => i !== v));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome_empresa) {
      toast.error('Nome do Grupo/Organização é obrigatório');
      return;
    }
    salvarMutation.mutate({
      ...form,
      tipo_organizacao: form.tipo_organizacao || 'Empresa'
    });
  };

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('logo_empresa_url', file_url);
    toast.success('Logo carregada');
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando organização...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Grupo / Organização
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre o grupo ou organização que possui uma ou mais unidades, plantas ou operações territoriais. Os dados antigos da "Dados da Empresa" foram migrados para este nível.
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Grupo / Organização *</Label>
              <Input
                value={form.nome_empresa}
                onChange={e => set('nome_empresa', e.target.value)}
                placeholder="Ex: ArcelorMittal, Cimento Nacional, Vale"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nome institucional completo</Label>
              <Input
                value={form.nome_institucional_completo || ''}
                onChange={e => set('nome_institucional_completo', e.target.value)}
                placeholder="Razão social quando distinta do nome fantasia"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de organização</Label>
              <Select value={form.tipo_organizacao} onValueChange={v => set('tipo_organizacao', v)}>
                <SelectTrigger><SelectValue placeholder="Tipo de organização" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_ORG.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CNPJ principal</Label>
              <Input
                value={form.cnpj || ''}
                onChange={e => set('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Setor principal</Label>
              <Select value={form.setor_atuacao} onValueChange={v => set('setor_atuacao', v)}>
                <SelectTrigger><SelectValue placeholder="Setor principal" /></SelectTrigger>
                <SelectContent>
                  {SETORES_PRINCIPAIS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site institucional</Label>
              <Input
                value={form.site_institucional || ''}
                onChange={e => set('site_institucional', e.target.value)}
                placeholder="www.organizacao.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo da organização</Label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border rounded flex items-center justify-center bg-slate-50 overflow-hidden">
                  {form.logo_empresa_url ? (
                    <img src={form.logo_empresa_url} alt="logo" className="w-full h-full object-contain" />
                  ) : <Upload className="w-4 h-4 text-slate-400" />}
                </div>
                <label>
                  <span className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2">
                    <Upload className="w-4 h-4 mr-1" /> Carregar logo
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.descricao_grupo || ''}
              onChange={e => set('descricao_grupo', e.target.value)}
              rows={3}
              placeholder="Descrição geral do grupo/organização"
            />
          </div>

          <div className="space-y-2">
            <Label>Territórios de influência (municípios/territórios)</Label>
            <div className="flex gap-2">
              <Input
                value={territoriosInput}
                onChange={e => setTerritoriosInput(e.target.value)}
                placeholder="Ex: Matozinhos/MG, Sete Lagoas/MG"
              />
              <Button type="button" variant="outline" onClick={() => addToList('territorios_influencia', territoriosInput, territoriosInput, setTerritoriosInput)}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.territorios_influencia || []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-200">
                  {t}
                  <button type="button" className="text-emerald-500 hover:text-emerald-700" onClick={() => removeFromList('territorios_influencia', t)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" />
            Contato Responsável
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.contato_responsavel?.nome || ''} onChange={e => set('contato_responsavel', { ...form.contato_responsavel, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={form.contato_responsavel?.cargo || ''} onChange={e => set('contato_responsavel', { ...form.contato_responsavel, cargo: e.target.value })} placeholder="Ex: Gerente de Sustentabilidade" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.contato_responsavel?.email || ''} onChange={e => set('contato_responsavel', { ...form.contato_responsavel, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.contato_responsavel?.telefone || ''} onChange={e => set('contato_responsavel', { ...form.contato_responsavel, telefone: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background py-3 border-t">
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" size="lg" disabled={salvarMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {salvarMutation.isPending ? 'Salvando...' : 'Salvar Organização'}
        </Button>
      </div>
    </form>
  );
}