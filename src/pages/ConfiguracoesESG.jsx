import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Save, Globe, Shield, Target, Upload, Info } from 'lucide-react';
import { toast } from 'sonner';
import { REFERENCIAIS_ESG, GRI_DETALHAMENTO, ODS_LISTA } from '@/lib/referenciais';

export default function ConfiguracoesESG() {
  const queryClient = useQueryClient();

  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['configuracao-esg'],
    queryFn: async () => {
      const configs = await base44.entities.ConfiguracaoESG.list('-created_date', 1);
      return configs[0] || null;
    }
  });

  const [formData, setFormData] = useState({
    nome_empresa: '',
    cnpj: '',
    setor_atuacao: '',
    territorios_influencia: [],
    estrategia_esg: '',
    compromissos_publicos: [],
    referenciais_prioritarios: {
      gri_standards: [],
      gri_detalhamento: [],
      ods_prioritarios: [],
      esrs_aplicaveis: []
    },
    contato_responsavel: {
      nome: '',
      cargo: '',
      email: '',
      telefone: ''
    },
    metodologia_classificacao: 'Classificação automática por IA utilizando análise de palavras-chave e contexto temático',
    logo_empresa_url: ''
  });

  React.useEffect(() => {
    if (configuracao) {
      const r = configuracao.referenciais_prioritarios || {};
      setFormData({
        ...configuracao,
        referenciais_prioritarios: {
          gri_standards: r.gri_standards || [],
          gri_detalhamento: r.gri_detalhamento || [],
          ods_prioritarios: r.ods_prioritarios || [],
          esrs_aplicaveis: r.esrs_aplicaveis || []
        }
      });
    }
  }, [configuracao]);

  const salvarMutation = useMutation({
    mutationFn: async (data) => {
      if (configuracao) {
        return await base44.entities.ConfiguracaoESG.update(configuracao.id, data);
      } else {
        return await base44.entities.ConfiguracaoESG.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-esg'] });
      queryClient.invalidateQueries({ queryKey: ['referenciais-esg-dashboard'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    salvarMutation.mutate(formData);
  };

  const toggleReferencial = (id) => {
    setFormData(prev => ({
      ...prev,
      compromissos_publicos: (prev.compromissos_publicos || []).includes(id)
        ? prev.compromissos_publicos.filter(c => c !== id)
        : [...(prev.compromissos_publicos || []), id]
    }));
  };

  const toggleGRIDetalhamento = (codigo) => {
    setFormData(prev => {
      const atuais = prev.referenciais_prioritarios.gri_detalhamento || [];
      return {
        ...prev,
        referenciais_prioritarios: {
          ...prev.referenciais_prioritarios,
          gri_detalhamento: atuais.includes(codigo)
            ? atuais.filter(g => g !== codigo)
            : [...atuais, codigo]
        }
      };
    });
  };

  const toggleODS = (ods) => {
    setFormData(prev => ({
      ...prev,
      referenciais_prioritarios: {
        ...prev.referenciais_prioritarios,
        ods_prioritarios: (prev.referenciais_prioritarios.ods_prioritarios || []).includes(ods)
          ? prev.referenciais_prioritarios.ods_prioritarios.filter(o => o !== ods)
          : [...(prev.referenciais_prioritarios.ods_prioritarios || []), ods]
      }
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  const griSelecionado = (formData.compromissos_publicos || []).includes('GRI');

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações ESG</h1>
          <p className="text-slate-500 mt-1">Configure os dados da empresa e os referenciais adotados</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Empresa */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={formData.nome_empresa}
                  onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                  placeholder="Nome completo da empresa"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Setor de Atuação</Label>
              <Input
                value={formData.setor_atuacao}
                onChange={(e) => setFormData({ ...formData, setor_atuacao: e.target.value })}
                placeholder="Ex: Mineração, Energia, Infraestrutura"
              />
            </div>

            <div className="space-y-2">
              <Label>Estratégia de Relacionamento Comunitário e ESG</Label>
              <Textarea
                value={formData.estrategia_esg}
                onChange={(e) => setFormData({ ...formData, estrategia_esg: e.target.value })}
                placeholder="Descreva a estratégia de relacionamento comunitário, engajamento de stakeholders e gestão social territorial..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Referenciais e Compromissos ESG */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Referenciais e Compromissos ESG
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Referenciais relacionados ao relacionamento comunitário, engajamento de stakeholders,
              direitos humanos, impacto social e gestão territorial adotados ou utilizados pela organização.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REFERENCIAIS_ESG.map((ref) => (
                <div key={ref.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={(formData.compromissos_publicos || []).includes(ref.id)}
                    onCheckedChange={() => toggleReferencial(ref.id)}
                  />
                  <div onClick={() => toggleReferencial(ref.id)} className="cursor-pointer">
                    <label className="text-sm font-medium text-slate-800 cursor-pointer">{ref.nome}</label>
                    <p className="text-xs text-slate-500 mt-0.5">{ref.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalhamento dos Referenciais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              Detalhamento dos Referenciais
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Os detalhamentos aparecem apenas quando o referencial correspondente é selecionado.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GRI Detalhamento */}
            <div>
              <Label className="text-base mb-1 block">GRI — Detalhamento</Label>
              {!griSelecionado ? (
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" /> Selecione "GRI" nos Referenciais acima para detalhar os padrões.
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-3">
                    Padrões relacionados ao relacionamento social. GRI 2-29 e GRI 413 são detalhamentos
                    internos do GRI — não compromissos independentes.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {GRI_DETALHAMENTO.map((g) => (
                      <div key={g.codigo} className="flex items-start gap-2 p-3 bg-emerald-50 rounded border border-emerald-100">
                        <Checkbox
                          checked={(formData.referenciais_prioritarios.gri_detalhamento || []).includes(g.codigo)}
                          onCheckedChange={() => toggleGRIDetalhamento(g.codigo)}
                        />
                        <div onClick={() => toggleGRIDetalhamento(g.codigo)} className="cursor-pointer">
                          <label className="text-sm font-medium text-slate-800 cursor-pointer">{g.codigo}</label>
                          <p className="text-xs text-slate-600 mt-0.5">{g.nome}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{g.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ODS Prioritários (seleção múltipla) */}
            <div>
              <Label className="text-base mb-1 block">ODS Prioritários (seleção múltipla)</Label>
              <p className="text-xs text-slate-500 mb-3">
                Selecione um ou mais Objetivos de Desenvolvimento Sustentável. Programas, ações,
                compromissos e registros podem ser associados aos ODS selecionados.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {ODS_LISTA.map((ods) => {
                  const checked = (formData.referenciais_prioritarios.ods_prioritarios || []).includes(ods.id);
                  return (
                    <div key={ods.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded cursor-pointer" onClick={() => toggleODS(ods.id)}>
                      <Checkbox checked={checked} onCheckedChange={() => toggleODS(ods.id)} />
                      <div>
                        <span className="text-sm font-medium text-slate-800 block leading-tight">ODS {ods.id}</span>
                        <span className="text-[11px] text-slate-600 leading-tight block">{ods.nome}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              Contato Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.contato_responsavel?.nome || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, nome: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.contato_responsavel?.cargo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, cargo: e.target.value }
                  })}
                  placeholder="Ex: Gerente de Sustentabilidade"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.contato_responsavel?.email || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, email: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.contato_responsavel?.telefone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, telefone: e.target.value }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" size="lg" disabled={salvarMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {salvarMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </div>
  );
}