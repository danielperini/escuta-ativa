import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function FormularioAtor({ ator, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState(ator || {
    nome: '',
    tipo: 'lideranca',
    comunidade: '',
    organizacao: '',
    cargo: '',
    contato: {
      telefone: '',
      email: '',
      whatsapp: ''
    },
    nivel_influencia: 'medio',
    nivel_atividade: 'moderado',
    temas_interesse: [],
    notas: '',
    foto_url: ''
  });

  const [novoTema, setNovoTema] = useState('');

  const { data: comunidades = [] } = useQuery({
    queryKey: ['comunidades-ator'],
    queryFn: () => base44.entities.Comunidade.list()
  });

  const { data: organizacoes = [] } = useQuery({
    queryKey: ['organizacoes-ator'],
    queryFn: () => base44.entities.ProjetoOrganizacao.list()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.tipo) {
      alert('Preencha nome e tipo');
      return;
    }
    onSalvar(formData);
  };

  const adicionarTema = () => {
    if (novoTema.trim()) {
      setFormData(prev => ({
        ...prev,
        temas_interesse: [...(prev.temas_interesse || []), novoTema.trim()]
      }));
      setNovoTema('');
    }
  };

  const removerTema = (index) => {
    setFormData(prev => ({
      ...prev,
      temas_interesse: prev.temas_interesse.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ator ? 'Editar Ator' : 'Novo Ator'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do ator"
              />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lideranca">Liderança Comunitária</SelectItem>
                  <SelectItem value="representante">Representante de Organização</SelectItem>
                  <SelectItem value="morador">Morador</SelectItem>
                  <SelectItem value="associacao">Associação</SelectItem>
                  <SelectItem value="ong">ONG</SelectItem>
                  <SelectItem value="governo">Governo</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Comunidade</Label>
              <Select value={formData.comunidade} onValueChange={(v) => setFormData(p => ({ ...p, comunidade: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {comunidades.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Organização</Label>
              <Select value={formData.organizacao} onValueChange={(v) => setFormData(p => ({ ...p, organizacao: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {organizacoes.map(o => <SelectItem key={o.id} value={o.nome_oficial}>{o.nome_oficial}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Cargo/Função</Label>
            <Input
              value={formData.cargo}
              onChange={(e) => setFormData(p => ({ ...p, cargo: e.target.value }))}
              placeholder="Ex: Presidente da Associação"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.contato.telefone}
                onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, telefone: e.target.value } }))}
                placeholder="(00) 0000-0000"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.contato.whatsapp}
                onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, whatsapp: e.target.value } }))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.contato.email}
                onChange={(e) => setFormData(p => ({ ...p, contato: { ...p.contato, email: e.target.value } }))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Nível de Influência</Label>
              <Select value={formData.nivel_influencia} onValueChange={(v) => setFormData(p => ({ ...p, nivel_influencia: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nível de Atividade</Label>
              <Select value={formData.nivel_atividade} onValueChange={(v) => setFormData(p => ({ ...p, nivel_atividade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Temas de Interesse</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={novoTema}
                onChange={(e) => setNovoTema(e.target.value)}
                placeholder="Ex: Educação, Saúde, Infraestrutura"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTema())}
              />
              <Button type="button" size="icon" variant="outline" onClick={adicionarTema}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.temas_interesse?.map((tema, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {tema}
                  <button type="button" onClick={() => removerTema(i)}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              rows={4}
              value={formData.notas}
              onChange={(e) => setFormData(p => ({ ...p, notas: e.target.value }))}
              placeholder="Observações adicionais sobre o ator..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancelar} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#2D6A4F]">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}