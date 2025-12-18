import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Save, Trash2, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import NotasMetaODS from '@/components/ods/NotasMetaODS';

export default function DialogMetaODS({ aberto, onFechar, meta, odsInfo }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ods_numero: 1,
    ods_nome: '',
    meta_descricao: '',
    meta_quantitativa: 0,
    valor_atual: 0,
    unidade_medida: 'ações',
    prazo: new Date(),
    status: 'em_andamento',
    responsavel: '',
    percentual_conclusao: 0
  });

  useEffect(() => {
    if (meta) {
      setFormData({
        ...meta,
        prazo: meta.prazo ? new Date(meta.prazo) : new Date()
      });
    } else {
      setFormData({
        ods_numero: 1,
        ods_nome: odsInfo?.[1]?.nome || '',
        meta_descricao: '',
        meta_quantitativa: 0,
        valor_atual: 0,
        unidade_medida: 'ações',
        prazo: new Date(),
        status: 'em_andamento',
        responsavel: '',
        percentual_conclusao: 0
      });
    }
  }, [meta, aberto, odsInfo]);

  const salvarMutation = useMutation({
    mutationFn: async (dados) => {
      const percentual = dados.meta_quantitativa > 0 
        ? Math.round((dados.valor_atual / dados.meta_quantitativa) * 100)
        : 0;
      
      const dadosCompletos = {
        ...dados,
        percentual_conclusao: percentual,
        prazo: format(dados.prazo, 'yyyy-MM-dd')
      };

      if (meta?.id) {
        return await base44.entities.MetaODS.update(meta.id, dadosCompletos);
      } else {
        return await base44.entities.MetaODS.create(dadosCompletos);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-ods'] });
      toast.success(meta?.id ? 'Meta atualizada!' : 'Meta criada!');
      onFechar();
    },
    onError: () => {
      toast.error('Erro ao salvar meta');
    }
  });

  const excluirMutation = useMutation({
    mutationFn: () => base44.entities.MetaODS.delete(meta.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-ods'] });
      toast.success('Meta excluída!');
      onFechar();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    salvarMutation.mutate(formData);
  };

  const handleODSChange = (numero) => {
    setFormData({
      ...formData,
      ods_numero: parseInt(numero),
      ods_nome: odsInfo[numero].nome
    });
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta?.id ? 'Editar Meta ODS' : 'Nova Meta ODS'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados da Meta</TabsTrigger>
            <TabsTrigger value="notas" disabled={!meta?.id}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ODS</Label>
            <Select 
              value={formData.ods_numero.toString()} 
              onValueChange={handleODSChange}
              disabled={!!meta?.id}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Object.keys(odsInfo).map(num => (
                  <SelectItem key={num} value={num}>
                    {odsInfo[num].icon} ODS {num} - {odsInfo[num].nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição da Meta *</Label>
            <Textarea
              value={formData.meta_descricao}
              onChange={(e) => setFormData({ ...formData, meta_descricao: e.target.value })}
              placeholder="Ex: Realizar 50 ações de combate à pobreza até o final do ano"
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta Quantitativa *</Label>
              <Input
                type="number"
                value={formData.meta_quantitativa}
                onChange={(e) => setFormData({ ...formData, meta_quantitativa: parseFloat(e.target.value) || 0 })}
                placeholder="50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Valor Atual</Label>
              <Input
                type="number"
                value={formData.valor_atual}
                onChange={(e) => setFormData({ ...formData, valor_atual: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Unidade de Medida</Label>
            <Select 
              value={formData.unidade_medida} 
              onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ações">Ações</SelectItem>
                <SelectItem value="beneficiários">Beneficiários</SelectItem>
                <SelectItem value="comunidades">Comunidades</SelectItem>
                <SelectItem value="projetos">Projetos</SelectItem>
                <SelectItem value="investimento">Investimento (R$)</SelectItem>
                <SelectItem value="horas">Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.prazo, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.prazo}
                    onSelect={(date) => setFormData({ ...formData, prazo: date || new Date() })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="atingida">Atingida</SelectItem>
                  <SelectItem value="atrasada">Atrasada</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>

              <div className="flex justify-between pt-4 border-t">
                {meta?.id && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => excluirMutation.mutate()}
                    disabled={excluirMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={onFechar}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={salvarMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    {salvarMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notas">
            {meta?.id && <NotasMetaODS meta={meta} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}