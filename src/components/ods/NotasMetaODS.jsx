import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const TIPOS_NOTA = {
  progresso: { label: 'Progresso', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  desafio: { label: 'Desafio', icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
  conquista: { label: 'Conquista', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  observacao: { label: 'Observação', icon: FileText, color: 'bg-slate-100 text-slate-700' }
};

export default function NotasMetaODS({ meta }) {
  const queryClient = useQueryClient();
  const [novaNota, setNovaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('progresso');
  const [adicionando, setAdicionando] = useState(false);

  const adicionarNotaMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const notasAtualizadas = [
        ...(meta.notas || []),
        {
          texto: novaNota,
          data: new Date().toISOString(),
          autor: user.full_name || user.email,
          tipo: tipoNota
        }
      ];
      
      return await base44.entities.MetaODS.update(meta.id, { notas: notasAtualizadas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-ods'] });
      toast.success('Nota adicionada!');
      setNovaNota('');
      setAdicionando(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (novaNota.trim()) {
      adicionarNotaMutation.mutate();
    }
  };

  const notas = meta.notas || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4" />
          Notas e Comentários
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Notas */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notas.length > 0 ? notas.slice().reverse().map((nota, index) => {
            const tipo = TIPOS_NOTA[nota.tipo] || TIPOS_NOTA.observacao;
            const Icon = tipo.icon;
            
            return (
              <div key={index} className="p-3 bg-slate-50 rounded-lg border-l-4" style={{ borderLeftColor: tipo.color.includes('blue') ? '#3B82F6' : tipo.color.includes('amber') ? '#F59E0B' : tipo.color.includes('green') ? '#10B981' : '#64748B' }}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${tipo.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={tipo.color}>
                        {tipo.label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {format(new Date(nota.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{nota.texto}</p>
                    <p className="text-xs text-slate-500 mt-1">Por {nota.autor}</p>
                  </div>
                </div>
              </div>
            );
          }) : (
            <p className="text-center text-slate-500 py-8 text-sm">Nenhuma nota registrada ainda</p>
          )}
        </div>

        {/* Formulário de Nova Nota */}
        {adicionando ? (
          <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-blue-50 rounded-lg">
            <Select value={tipoNota} onValueChange={setTipoNota}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_NOTA).map(([key, tipo]) => {
                  const Icon = tipo.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Textarea
              value={novaNota}
              onChange={(e) => setNovaNota(e.target.value)}
              placeholder="Digite sua nota ou comentário sobre esta meta..."
              rows={4}
              className="bg-white"
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button 
                type="submit" 
                size="sm" 
                disabled={!novaNota.trim() || adicionarNotaMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Adicionar Nota
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setAdicionando(false);
                  setNovaNota('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            onClick={() => setAdicionando(true)} 
            variant="outline" 
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Adicionar Nota
          </Button>
        )}
      </CardContent>
    </Card>
  );
}