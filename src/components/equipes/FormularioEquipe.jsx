import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const CORES_EQUIPE = [
  '#2D6A4F', '#40916C', '#52B788', '#74C69D',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#EF4444', '#10B981', '#06B6D4', '#6366F1'
];

export default function FormularioEquipe({ open, onOpenChange, equipe, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'campo',
    supervisor_email: '',
    coordenadores_emails: [],
    coordenador_geral_email: '',
    comunidades_atendidas: [],
    territorios_responsabilidade: [],
    cor_identificacao: CORES_EQUIPE[0],
    ativa: true,
    membros: [],
    metas: {
      registros_mes: 0,
      reunioes_mes: 0,
      devolutivas_prazo: 15
    }
  });

  const [novaComunidade, setNovaComunidade] = useState('');
  const [novoTerritorio, setNovoTerritorio] = useState('');
  const [novoCoordenador, setNovoCoordenador] = useState('');

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  React.useEffect(() => {
    if (equipe) {
      setFormData({
        nome: equipe.nome || '',
        descricao: equipe.descricao || '',
        tipo: equipe.tipo || 'campo',
        supervisor_email: equipe.supervisor_email || '',
        coordenadores_emails: equipe.coordenadores_emails || [],
        coordenador_geral_email: equipe.coordenador_geral_email || '',
        comunidades_atendidas: equipe.comunidades_atendidas || [],
        territorios_responsabilidade: equipe.territorios_responsabilidade || [],
        cor_identificacao: equipe.cor_identificacao || CORES_EQUIPE[0],
        ativa: equipe.ativa !== false,
        membros: equipe.membros || [],
        metas: equipe.metas || {
          registros_mes: 0,
          reunioes_mes: 0,
          devolutivas_prazo: 15
        }
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'campo',
        supervisor_email: '',
        coordenadores_emails: [],
        coordenador_geral_email: '',
        comunidades_atendidas: [],
        territorios_responsabilidade: [],
        cor_identificacao: CORES_EQUIPE[0],
        ativa: true,
        membros: [],
        metas: {
          registros_mes: 0,
          reunioes_mes: 0,
          devolutivas_prazo: 15
        }
      });
    }
  }, [equipe, open]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Adicionar membros automaticamente baseado nos emails
      const membrosAtualizados = [...(data.membros || [])];
      
      // Adicionar coordenador geral
      if (data.coordenador_geral_email && !membrosAtualizados.find(m => m.email === data.coordenador_geral_email)) {
        membrosAtualizados.push({
          email: data.coordenador_geral_email,
          funcao: 'coordenador_geral',
          data_entrada: new Date().toISOString().split('T')[0],
          ativo: true
        });
      }

      // Adicionar coordenadores
      data.coordenadores_emails?.forEach(email => {
        if (!membrosAtualizados.find(m => m.email === email)) {
          membrosAtualizados.push({
            email,
            funcao: 'coordenador',
            data_entrada: new Date().toISOString().split('T')[0],
            ativo: true
          });
        }
      });

      // Adicionar supervisor
      if (data.supervisor_email && !membrosAtualizados.find(m => m.email === data.supervisor_email)) {
        membrosAtualizados.push({
          email: data.supervisor_email,
          funcao: 'supervisor',
          data_entrada: new Date().toISOString().split('T')[0],
          ativo: true
        });
      }

      const dataComMembros = { ...data, membros: membrosAtualizados };
      
      if (equipe) {
        return base44.entities.Equipe.update(equipe.id, dataComMembros);
      }
      return base44.entities.Equipe.create(dataComMembros);
    },
    onSuccess: () => {
      toast.success(equipe ? 'Equipe atualizada com sucesso' : 'Equipe criada com sucesso');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Erro ao salvar equipe');
      console.error(error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const adicionarComunidade = () => {
    if (novaComunidade && !formData.comunidades_atendidas.includes(novaComunidade)) {
      setFormData(prev => ({
        ...prev,
        comunidades_atendidas: [...prev.comunidades_atendidas, novaComunidade]
      }));
      setNovaComunidade('');
    }
  };

  const removerComunidade = (comunidade) => {
    setFormData(prev => ({
      ...prev,
      comunidades_atendidas: prev.comunidades_atendidas.filter(c => c !== comunidade)
    }));
  };

  const adicionarTerritorio = () => {
    if (novoTerritorio && !formData.territorios_responsabilidade.includes(novoTerritorio)) {
      setFormData(prev => ({
        ...prev,
        territorios_responsabilidade: [...prev.territorios_responsabilidade, novoTerritorio]
      }));
      setNovoTerritorio('');
    }
  };

  const removerTerritorio = (territorio) => {
    setFormData(prev => ({
      ...prev,
      territorios_responsabilidade: prev.territorios_responsabilidade.filter(t => t !== territorio)
    }));
  };

  const adicionarCoordenador = () => {
    if (novoCoordenador && !formData.coordenadores_emails.includes(novoCoordenador)) {
      setFormData(prev => ({
        ...prev,
        coordenadores_emails: [...prev.coordenadores_emails, novoCoordenador]
      }));
      setNovoCoordenador('');
    }
  };

  const removerCoordenador = (email) => {
    setFormData(prev => ({
      ...prev,
      coordenadores_emails: prev.coordenadores_emails.filter(e => e !== email)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipe ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome da Equipe *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Equipe Território Norte"
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da equipe"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Equipe</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campo">Campo</SelectItem>
                  <SelectItem value="analise">Análise</SelectItem>
                  <SelectItem value="coordenacao">Coordenação</SelectItem>
                  <SelectItem value="mista">Mista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex gap-2">
                {CORES_EQUIPE.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${formData.cor_identificacao === cor ? 'border-slate-900' : 'border-transparent'}`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setFormData(prev => ({ ...prev, cor_identificacao: cor }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hierarquia */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Hierarquia</h3>
            
            <div className="space-y-2">
              <Label>Coordenador Geral (Email)</Label>
              <Input
                type="email"
                value={formData.coordenador_geral_email}
                onChange={(e) => setFormData(prev => ({ ...prev, coordenador_geral_email: e.target.value }))}
                placeholder="coordenador.geral@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Coordenadores (Emails)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={novoCoordenador}
                  onChange={(e) => setNovoCoordenador(e.target.value)}
                  placeholder="coordenador@empresa.com"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarCoordenador())}
                />
                <Button type="button" onClick={adicionarCoordenador} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.coordenadores_emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.coordenadores_emails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        type="button"
                        onClick={() => removerCoordenador(email)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Supervisor (Email) *</Label>
              <Input
                type="email"
                value={formData.supervisor_email}
                onChange={(e) => setFormData(prev => ({ ...prev, supervisor_email: e.target.value }))}
                placeholder="supervisor@empresa.com"
                required
              />
            </div>
          </div>

          {/* Territórios */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Territórios e Comunidades</h3>
            
            <div className="space-y-2">
              <Label>Comunidades Atendidas</Label>
              <div className="flex gap-2">
                <Select value={novaComunidade} onValueChange={setNovaComunidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma comunidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {comunidades.map(c => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={adicionarComunidade} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.comunidades_atendidas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.comunidades_atendidas.map(com => (
                    <Badge key={com} variant="secondary" className="gap-1">
                      {com}
                      <button
                        type="button"
                        onClick={() => removerComunidade(com)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Territórios de Responsabilidade</Label>
              <div className="flex gap-2">
                <Input
                  value={novoTerritorio}
                  onChange={(e) => setNovoTerritorio(e.target.value)}
                  placeholder="Ex: Região Norte"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTerritorio())}
                />
                <Button type="button" onClick={adicionarTerritorio} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.territorios_responsabilidade.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.territorios_responsabilidade.map(ter => (
                    <Badge key={ter} variant="secondary" className="gap-1">
                      {ter}
                      <button
                        type="button"
                        onClick={() => removerTerritorio(ter)}
                        className="ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metas */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Metas da Equipe</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Registros/Mês</Label>
                <Input
                  type="number"
                  value={formData.metas.registros_mes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metas: { ...prev.metas, registros_mes: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Reuniões/Mês</Label>
                <Input
                  type="number"
                  value={formData.metas.reunioes_mes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metas: { ...prev.metas, reunioes_mes: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo Devolutivas (dias)</Label>
                <Input
                  type="number"
                  value={formData.metas.devolutivas_prazo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    metas: { ...prev.metas, devolutivas_prazo: parseInt(e.target.value) || 15 }
                  }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {equipe ? 'Atualizar' : 'Criar'} Equipe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}