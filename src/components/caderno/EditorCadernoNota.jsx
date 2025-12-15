import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Upload, Loader2, FileCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProcessadorCaderno from './ProcessadorCaderno';

export default function EditorCadernoNota({ nota, onVoltar }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState(nota.titulo || '');
  const [textoExtraido, setTextoExtraido] = useState(nota.texto_extraido || '');
  const [tags, setTags] = useState(nota.tags?.join(', ') || '');
  const [arquivos, setArquivos] = useState(nota.arquivos || []);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CadernoNota.update(nota.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      toast.success('Nota salva!');
    }
  });

  const criarRegistroMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('criarRegistroApartirCaderno', {
        cadernoNotaId: nota.id,
        textoSelecionado: textoExtraido,
        dadosRegistro: {
          titulo: titulo,
          transcricao: textoExtraido,
          tipo: 'conversa_campo',
          status: 'rascunho'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Registro criado! Redirecionando...');
      setTimeout(() => {
        navigate(createPageUrl('VerRegistro') + `?id=${data.registro_id}`);
      }, 1000);
    }
  });

  const handleSalvar = () => {
    saveMutation.mutate({
      titulo,
      texto_extraido: textoExtraido,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      arquivos
    });
  };

  const handleProcessamentoCompleto = (textoProcessado, arquivosProcessados) => {
    setTextoExtraido(prev => prev + '\n\n' + textoProcessado);
    setArquivos(prev => [...prev, ...arquivosProcessados]);
    
    saveMutation.mutate({
      titulo,
      texto_extraido: textoExtraido + '\n\n' + textoProcessado,
      arquivos: [...arquivos, ...arquivosProcessados],
      status: 'pronto'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onVoltar} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSalvar}
            disabled={saveMutation.isPending}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>
          <Button
            onClick={() => criarRegistroMutation.mutate()}
            disabled={criarRegistroMutation.isPending || !textoExtraido}
            className="bg-[#E31E24] hover:bg-[#B01419] gap-2"
          >
            {criarRegistroMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Usar em Registro
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Título da Nota
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite um título para organizar..."
              className="text-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Tags (separadas por vírgula)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="reunião, comunidade x, urgente..."
            />
          </div>

          {arquivos.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Arquivos Anexados
              </label>
              <div className="flex flex-wrap gap-2">
                {arquivos.map((arquivo, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    <FileCheck className="w-3 h-3" />
                    {arquivo.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processador */}
      <ProcessadorCaderno
        notaId={nota.id}
        onProcessamentoCompleto={handleProcessamentoCompleto}
      />

      {/* Editor de Texto */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Texto Extraído/Transcrito
              </label>
              <Badge variant="secondary">
                {textoExtraido.length} caracteres
              </Badge>
            </div>
            <Textarea
              value={textoExtraido}
              onChange={(e) => setTextoExtraido(e.target.value)}
              placeholder="O texto transcrito ou extraído aparecerá aqui. Você pode editar livremente..."
              className="min-h-[400px] font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              💡 Este é um espaço livre. Edite, organize e copie trechos para criar registros formais quando estiver pronto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}