import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Save, Leaf, Globe, Shield, Target, Upload } from 'lucide-react';
import { toast } from 'sonner';

const COMPROMISSOS_DISPONIVEIS = ['GRI', 'Pacto Global', 'ODS', 'CSRD', 'B Corp', 'ISO 26000', 'Outro'];
const GRI_DISPONIVEIS = ['GRI 102', 'GRI 103', 'GRI 403', 'GRI 404', 'GRI 405', 'GRI 406', 'GRI 408', 'GRI 409', 'GRI 413'];
const ODS_DISPONIVEIS = [1, 4, 5, 8, 10, 11, 16, 17];
const ESRS_DISPONIVEIS = ['ESRS 2', 'ESRS S1', 'ESRS S3', 'ESRS G1'];

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
      ods_prioritarios: [],
      esrs_aplicaveis: []
    },
    contato_responsavel: {
      nome: '',
      cargo: '',
      email: '',
      telefone: ''
    },
    metodologia_classificacao: '',
    logo_empresa_url: ''
  });

  React.useEffect(() => {
    if (configuracao) {
      setFormData(configuracao);
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

  const toggleCompromisso = (compromisso) => {
    setFormData(prev => ({
      ...prev,
      compromissos_publicos: prev.compromissos_publicos.includes(compromisso)
        ? prev.compromissos_publicos.filter(c => c !== compromisso)
        : [...prev.compromissos_publicos, compromisso]
    }));
  };

  const toggleGRI = (gri) => {
    setFormData(prev => ({
      ...prev,
      referenciais_prioritarios: {
        ...prev.referenciais_prioritarios,
        gri_standards: prev.referenciais_prioritarios.gri_standards.includes(gri)
          ? prev.referenciais_prioritarios.gri_standards.filter(g => g !== gri)
          : [...prev.referenciais_prioritarios.gri_standards, gri]
      }
    }));
  };

  const toggleODS = (ods) => {
    setFormData(prev => ({
      ...prev,
      referenciais_prioritarios: {
        ...prev.referenciais_prioritarios,
        ods_prioritarios: prev.referenciais_prioritarios.ods_prioritarios.includes(ods)
          ? prev.referenciais_prioritarios.ods_prioritarios.filter(o => o !== ods)
          : [...prev.referenciais_prioritarios.ods_prioritarios, ods]
      }
    }));
  };

  const toggleESRS = (esrs) => {
    setFormData(prev => ({
      ...prev,
      referenciais_prioritarios: {
        ...prev.referenciais_prioritarios,
        esrs_aplicaveis: prev.referenciais_prioritarios.esrs_aplicaveis.includes(esrs)
          ? prev.referenciais_prioritarios.esrs_aplicaveis.filter(e => e !== esrs)
          : [...prev.referenciais_prioritarios.esrs_aplicaveis, esrs]
      }
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações ESG</h1>
          <p className="text-slate-500 mt-1">Configure os dados da empresa para geração de relatórios</p>
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
              <Label>Estratégia ESG</Label>
              <Textarea
                value={formData.estrategia_esg}
                onChange={(e) => setFormData({ ...formData, estrategia_esg: e.target.value })}
                placeholder="Descreva a estratégia ESG da empresa..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compromissos Públicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Compromissos Públicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMPROMISSOS_DISPONIVEIS.map(compromisso => (
                <div key={compromisso} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.compromissos_publicos.includes(compromisso)}
                    onCheckedChange={() => toggleCompromisso(compromisso)}
                  />
                  <label className="text-sm font-medium cursor-pointer" onClick={() => toggleCompromisso(compromisso)}>
                    {compromisso}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referenciais Prioritários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Referenciais Prioritários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base mb-3 block">GRI Standards</Label>
              <div className="grid grid-cols-3 gap-3">
                {GRI_DISPONIVEIS.map(gri => (
                  <div key={gri} className="flex items-center gap-2 p-2 bg-indigo-50 rounded">
                    <Checkbox
                      checked={formData.referenciais_prioritarios.gri_standards.includes(gri)}
                      onCheckedChange={() => toggleGRI(gri)}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => toggleGRI(gri)}>{gri}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base mb-3 block">ODS Prioritários</Label>
              <div className="grid grid-cols-4 gap-3">
                {ODS_DISPONIVEIS.map(ods => (
                  <div key={ods} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Checkbox
                      checked={formData.referenciais_prioritarios.ods_prioritarios.includes(ods)}
                      onCheckedChange={() => toggleODS(ods)}
                    />
                    <label className="text-sm font-medium cursor-pointer" onClick={() => toggleODS(ods)}>
                      ODS {ods}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base mb-3 block">ESRS Aplicáveis (CSRD)</Label>
              <div className="grid grid-cols-2 gap-3">
                {ESRS_DISPONIVEIS.map(esrs => (
                  <div key={esrs} className="flex items-center gap-2 p-2 bg-emerald-50 rounded">
                    <Checkbox
                      checked={formData.referenciais_prioritarios.esrs_aplicaveis.includes(esrs)}
                      onCheckedChange={() => toggleESRS(esrs)}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => toggleESRS(esrs)}>{esrs}</label>
                  </div>
                ))}
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
                  value={formData.contato_responsavel.nome}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, nome: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.contato_responsavel.cargo}
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
                  value={formData.contato_responsavel.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contato_responsavel: { ...formData.contato_responsavel, email: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.contato_responsavel.telefone}
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