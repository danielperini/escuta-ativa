import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeletorTemplates({ onSelecionar, tipoAtual }) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [criandoTemplate, setCriandoTemplate] = useState(false);
  const [novoTemplate, setNovoTemplate] = useState({
    nome: '',
    descricao: '',
    tipo: tipoAtual || 'conversa_campo',
    campos_padrao: {}
  });

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.TemplateRegistro.list()
  });

  const criarTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.TemplateRegistro.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template criado com sucesso');
      setDialogAberto(false);
      setCriandoTemplate(false);
      setNovoTemplate({ nome: '', descricao: '', tipo: tipoAtual, campos_padrao: {} });
    }
  });

  const deletarTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.TemplateRegistro.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template removido');
    }
  });

  const templatesFiltrados = templates.filter(t => t.ativo && (!tipoAtual || t.tipo === tipoAtual));

  const handleCriarTemplate = () => {
    if (!novoTemplate.nome) {
      toast.error('Nome do template é obrigatório');
      return;
    }
    criarTemplateMutation.mutate(novoTemplate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E31E24]" />
            Templates de Registro
          </div>
          <Dialog open={criandoTemplate} onOpenChange={setCriandoTemplate}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do Template *</label>
                  <Input
                    value={novoTemplate.nome}
                    onChange={(e) => setNovoTemplate({ ...novoTemplate, nome: e.target.value })}
                    placeholder="Ex: Reunião Mensal Padrão"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={novoTemplate.descricao}
                    onChange={(e) => setNovoTemplate({ ...novoTemplate, descricao: e.target.value })}
                    placeholder="Descreva quando usar este template"
                    rows={3}
                  />
                </div>
                <Button onClick={handleCriarTemplate} className="w-full bg-[#E31E24] hover:bg-[#B01419]">
                  Criar Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templatesFiltrados.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum template disponível. Crie um para reutilizar dados comuns.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templatesFiltrados.map(template => (
              <div
                key={template.id}
                className="border rounded-lg p-3 hover:border-[#E31E24] transition-colors cursor-pointer group"
                onClick={() => onSelecionar(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{template.nome}</p>
                    {template.descricao && (
                      <p className="text-xs text-slate-500 mt-1">{template.descricao}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarTemplateMutation.mutate(template.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="outline">{template.tipo}</Badge>
                  {template.uso_total > 0 && (
                    <span>Usado {template.uso_total}x</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}