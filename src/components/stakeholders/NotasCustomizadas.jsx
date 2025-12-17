import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StickyNote, Plus, Trash2, Lock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const tipoConfig = {
  observacao: { label: 'Observação', color: 'bg-blue-100 text-blue-700' },
  alerta: { label: 'Alerta', color: 'bg-red-100 text-red-700' },
  conquista: { label: 'Conquista', color: 'bg-green-100 text-green-700' },
  dificuldade: { label: 'Dificuldade', color: 'bg-amber-100 text-amber-700' },
  outro: { label: 'Outro', color: 'bg-slate-100 text-slate-700' }
};

export default function NotasCustomizadas({ stakeholder }) {
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [novaNota, setNovaNota] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'observacao',
    privada: false
  });
  
  const queryClient = useQueryClient();
  const notas = stakeholder.notas_customizadas || [];

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const salvarNotaMutation = useMutation({
    mutationFn: async (nota) => {
      const notasAtualizadas = editando 
        ? notas.map(n => n === editando ? { ...nota, data: editando.data, autor: editando.autor } : n)
        : [...notas, { 
            ...nota, 
            data: new Date().toISOString(), 
            autor: user?.full_name || user?.email 
          }];
      
      await base44.entities.Stakeholder.update(stakeholder.id, {
        notas_customizadas: notasAtualizadas
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
      setAdicionando(false);
      setEditando(null);
      setNovaNota({ titulo: '', conteudo: '', tipo: 'observacao', privada: false });
      toast.success(editando ? 'Nota atualizada!' : 'Nota adicionada!');
    }
  });

  const excluirNotaMutation = useMutation({
    mutationFn: async (notaParaExcluir) => {
      const notasAtualizadas = notas.filter(n => n !== notaParaExcluir);
      await base44.entities.Stakeholder.update(stakeholder.id, {
        notas_customizadas: notasAtualizadas
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stakeholder', stakeholder.id]);
      toast.success('Nota excluída!');
    }
  });

  const handleSalvar = () => {
    if (!novaNota.titulo || !novaNota.conteudo) {
      toast.error('Preencha título e conteúdo');
      return;
    }
    salvarNotaMutation.mutate(novaNota);
  };

  const handleEditar = (nota) => {
    setEditando(nota);
    setNovaNota({
      titulo: nota.titulo,
      conteudo: nota.conteudo,
      tipo: nota.tipo,
      privada: nota.privada
    });
    setAdicionando(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Notas Customizadas ({notas.length})
          </span>
          <Button
            size="sm"
            onClick={() => {
              setAdicionando(!adicionando);
              setEditando(null);
              setNovaNota({ titulo: '', conteudo: '', tipo: 'observacao', privada: false });
            }}
            className="bg-[#E31E24] hover:bg-[#B01419]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Nota
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de Nova Nota */}
        {adicionando && (
          <div className="p-4 bg-slate-50 rounded-lg border-2 border-[#E31E24] space-y-3">
            <Input
              placeholder="Título da nota"
              value={novaNota.titulo}
              onChange={(e) => setNovaNota({ ...novaNota, titulo: e.target.value })}
            />
            <Textarea
              placeholder="Conteúdo da nota..."
              value={novaNota.conteudo}
              onChange={(e) => setNovaNota({ ...novaNota, conteudo: e.target.value })}
              rows={4}
            />
            <div className="flex gap-3">
              <Select
                value={novaNota.tipo}
                onValueChange={(value) => setNovaNota({ ...novaNota, tipo: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaNota.privada}
                  onChange={(e) => setNovaNota({ ...novaNota, privada: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Privada
                </span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSalvar} className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332]">
                {editando ? 'Atualizar' : 'Salvar Nota'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAdicionando(false);
                  setEditando(null);
                  setNovaNota({ titulo: '', conteudo: '', tipo: 'observacao', privada: false });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Notas */}
        {notas.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <StickyNote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Nenhuma nota adicionada ainda</p>
            <p className="text-xs mt-1">Clique em "Nova Nota" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notas.map((nota, idx) => {
              const tipo = tipoConfig[nota.tipo] || tipoConfig.outro;
              
              return (
                <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      {nota.titulo}
                      {nota.privada && <Lock className="w-3 h-3 text-slate-400" />}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditar(nota)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => excluirNotaMutation.mutate(nota)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">
                    {nota.conteudo}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <Badge className={tipo.color}>
                      {tipo.label}
                    </Badge>
                    <span>
                      {format(new Date(nota.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {nota.autor && <span>• {nota.autor}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}