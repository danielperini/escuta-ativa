import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, MapPin, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const TIPOS_UNIDADE = ['Planta Industrial', 'Mina', 'Unidade Operacional', 'Escritório', 'Centro de Distribuição', 'Unidade Administrativa', 'Fundação/Instituto', 'Projeto', 'Empreendimento', 'Unidade de Serviço', 'Outro'];
const STATUS_UNIDADE = [
  { v: 'ativa', label: 'Ativa' },
  { v: 'implantacao', label: 'Implantação' },
  { v: 'temporariamente_inativa', label: 'Temporariamente inativa' },
  { v: 'encerrada', label: 'Encerrada' }
];
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const CAMPO_VAZIO = {
  nome: '', tipo_unidade: 'Planta Industrial', cnpj: '', setor_atividade: '', descricao_operacao: '',
  status: 'ativa', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '',
  uf: 'MG', cep: '', latitude: null, longitude: null, municipality_ibge_code: '',
  municipios_relacionamento: [], comunidades_vinculadas: []
};

export default function AbaUnidades({ configuracao }) {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(CAMPO_VAZIO);
  const [municipioInput, setMunicipioInput] = useState('');
  const [abertos, setAbertos] = useState({});

  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ['unidades-operacionais'],
    queryFn: () => base44.entities.UnidadeOperacional.list('-created_date', 500),
    enabled: !!configuracao
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-lista'],
    queryFn: () => base44.entities.Comunidade.list('-nome', 500)
  });

  const criarUnidade = useMutation({
    mutationFn: async (data) => base44.entities.UnidadeOperacional.create({
      ...data,
      organizacao_id: configuracao.id,
      organizacao_nome: configuracao.nome_empresa,
      ativo: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] });
      setModalAberto(false);
      toast.success('Unidade criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar unidade')
  });

  const editarUnidade = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.UnidadeOperacional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] });
      setModalAberto(false);
      toast.success('Unidade atualizada');
    },
    onError: () => toast.error('Erro ao atualizar unidade')
  });

  const excluirUnidade = useMutation({
    mutationFn: async (id) => base44.entities.UnidadeOperacional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades-operacionais'] });
      toast.success('Unidade removida');
    },
    onError: () => toast.error('Erro ao remover unidade')
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...CAMPO_VAZIO, uf: configuracao?.cnpj ? 'MG' : 'MG' });
    setMunicipioInput('');
    setModalAberto(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setForm({ ...CAMPO_VAZIO, ...u });
    setModalAberto(true);
  };

  const addMunicipio = () => {
    if (!municipioInput.trim()) return;
    if ((form.municipios_relacionamento || []).includes(municipioInput.trim())) return;
    set('municipios_relacionamento', [...(form.municipios_relacionamento || []), municipioInput.trim()]);
    setMunicipioInput('');
  };

  const removeMunicipio = (m) => set('municipios_relacionamento', (form.municipios_relacionamento || []).filter(x => x !== m));

  const toggleComunidade = (id) => {
    const atuais = form.comunidades_vinculadas || [];
    set('comunidades_vinculadas', atuais.includes(id) ? atuais.filter(c => c !== id) : [...atuais, id]);
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    if (!form.nome) {
      toast.error('Nome da unidade é obrigatório');
      return;
    }
    if (editando) {
      editarUnidade.mutate({ id: editando.id, data: form });
    } else {
      criarUnidade.mutate(form);
    }
  };

  const toggleAbrir = (id) => setAbertos(p => ({ ...p, [id]: !p[id] }));

  if (!configuracao) {
    return (
      <Card>
        <CardContent className="pt-8 text-center text-slate-500">
          Cadastre primeiro a Organização na aba "Organização" para então cadastrar unidades.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Unidades e Plantas do Grupo: {configuracao.nome_empresa}
          </h2>
          <p className="text-sm text-slate-500">
            Cadastre as unidades, plantas ou operações territoriais. Cada unidade pode ter território, comunidades e referenciais próprios.
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Nova Unidade
        </Button>
      </div>

      {/* Hierarquia visual Grupo → Unidades → Comunidades */}
      <Card className="bg-emerald-50/40 border-emerald-100">
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-emerald-800 mb-3">Hierarquia: Organização → Unidade → Território → Comunidade</h3>
          {isLoading ? <p className="text-sm text-slate-500">Carregando unidades...</p> : unidades.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma unidade cadastrada. Clique em "Nova Unidade" para começar.</p>
          ) : (
            <div className="text-sm">
              <div className="font-semibold text-slate-800 mb-1">{configuracao.nome_empresa}</div>
              <div className="ml-4 border-l border-emerald-200 pl-4 space-y-2">
                {unidades.map(u => {
                  const aberto = !!abertos[u.id];
                  const comsNomes = (comunidades || []).filter(c => (u.comunidades_vinculadas || []).includes(c.id));
                  return (
                    <div key={u.id}>
                      <button className="flex items-center gap-1 text-slate-800 hover:text-emerald-700" onClick={() => toggleAbrir(u.id)}>
                        {aberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span>{u.nome}</span>
                        <span className="text-xs text-slate-400 ml-2">({u.tipo_unidade || 'Unidade'}{u.municipio ? ` · ${u.municipio}/${u.uf || ''}` : ''})</span>
                      </button>
                      {aberto && (
                        <div className="ml-4 border-l border-emerald-200 pl-4 mt-1 space-y-1">
                          {comsNomes.length === 0 ? (
                            <span className="text-xs text-slate-400">Sem comunidades vinculadas a esta unidade.</span>
                          ) : comsNomes.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-slate-700">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              <span>{c.nome}</span>
                              {c.municipio && <span className="text-xs text-slate-400">· {c.municipio}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards das unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {unidades.map(u => {
          const totalComs = (u.comunidades_vinculadas || []).length;
          const status = STATUS_UNIDADE.find(s => s.v === (u.status || 'ativa'));
          return (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{u.nome}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{configuracao.nome_empresa}</p>
                    {u.tipo_unidade && <span className="text-xs text-slate-600 mt-0.5 block">{u.tipo_unidade}</span>}
                    {u.municipio && <p className="text-xs text-slate-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.municipio}{u.uf ? `/${u.uf}` : ''}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${status?.v === 'ativa' ? 'bg-emerald-100 text-emerald-700' : status?.v === 'encerrada' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                        {status?.label}
                      </span>
                      <span className="text-xs text-slate-500">Comunidades: {totalComs}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Button size="sm" variant="outline" onClick={() => abrirEditar(u)}><Edit className="w-3 h-3 mr-1" /> Editar</Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => excluirUnidade.mutate(u.id)}>
                    <Trash2 className="w-3 h-3 mr-1" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Nova/Editar Unidade */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Unidade' : 'Nova Unidade / Planta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Unidade *</Label>
                <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Unidade Matozinhos" required />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Unidade</Label>
                <Select value={form.tipo_unidade} onValueChange={v => set('tipo_unidade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_UNIDADE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CNPJ da unidade</Label>
                <Input value={form.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>Setor / Atividade da unidade</Label>
                <Input value={form.setor_atividade || ''} onChange={e => set('setor_atividade', e.target.value)} placeholder="Ex: Mineração, Siderurgia" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_UNIDADE.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da operação</Label>
              <Textarea value={form.descricao_operacao || ''} rows={2} onChange={e => set('descricao_operacao', e.target.value)} />
            </div>

            {/* Endereço */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Endereço da Unidade</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logradouro</Label>
                  <Input value={form.logradouro || ''} onChange={e => set('logradouro', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input value={form.numero || ''} onChange={e => set('numero', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input value={form.complemento || ''} onChange={e => set('complemento', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input value={form.bairro || ''} onChange={e => set('bairro', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input value={form.municipio || ''} onChange={e => set('municipio', e.target.value)} placeholder="Ex: Matozinhos" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Select value={form.uf} onValueChange={v => set('uf', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input value={form.cep || ''} onChange={e => set('cep', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Código IBGE</Label>
                    <Input value={form.municipality_ibge_code || ''} onChange={e => set('municipality_ibge_code', e.target.value)} placeholder="3136408" />
                  </div>
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input type="number" step="any" value={form.latitude || ''} onChange={e => set('latitude', e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input type="number" step="any" value={form.longitude || ''} onChange={e => set('longitude', e.target.value ? parseFloat(e.target.value) : null)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Território */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Território de Relacionamento</h4>
              <div className="space-y-2">
                <Label>Municípios adicionais de relacionamento</Label>
                <div className="flex gap-2">
                  <Input value={municipioInput} onChange={e => setMunicipioInput(e.target.value)} placeholder="Ex: Sete Lagoas/MG" />
                  <Button type="button" variant="outline" onClick={addMunicipio}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.municipios_relacionamento || []).map((m, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {m}
                      <button type="button" className="text-slate-500" onClick={() => removeMunicipio(m)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Comunidades vinculadas a esta unidade</Label>
                <p className="text-xs text-slate-400 mb-2">Selecione as comunidades que pertencem ao território desta unidade.</p>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                  {comunidades.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2">Nenhuma comunidade cadastrada ainda.</p>
                  ) : comunidades.map(c => {
                    const checked = (form.comunidades_vinculadas || []).includes(c.id);
                    return (
                      <div key={c.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer" onClick={() => toggleComunidade(c.id)}>
                        <Checkbox checked={checked} onCheckedChange={() => toggleComunidade(c.id)} />
                        <span className="text-sm text-slate-700">{c.nome}</span>
                        {c.municipio && <span className="text-xs text-slate-400">· {c.municipio}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={criarUnidade.isPending || editarUnidade.isPending}>
                {criarUnidade.isPending || editarUnidade.isPending ? 'Salvando...' : (editando ? 'Atualizar Unidade' : 'Criar Unidade')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}