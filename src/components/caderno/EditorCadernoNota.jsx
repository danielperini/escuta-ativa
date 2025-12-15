import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Upload, Loader2, FileCheck, ExternalLink, Star, Search, X, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function EditorCadernoNota({ nota, onVoltar }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState(nota.titulo || '');
  const [textoExtraido, setTextoExtraido] = useState(nota.texto_extraido || '');
  const [tags, setTags] = useState(nota.tags?.join(', ') || '');
  const [arquivos, setArquivos] = useState(nota.arquivos || []);
  const [buscaInterna, setBuscaInterna] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [novaTag, setNovaTag] = useState('');

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CadernoNota.update(nota.id, {
        ...data,
        ultima_modificacao: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      toast.success('Nota salva!');
    }
  });

  const toggleFavorita = async () => {
    try {
      await base44.entities.CadernoNota.update(nota.id, { 
        favorita: !nota.favorita,
        ultima_modificacao: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['caderno-notas'] });
      toast.success(!nota.favorita ? 'Nota favoritada!' : 'Removida dos favoritos');
      nota.favorita = !nota.favorita;
    } catch (error) {
      toast.error('Erro ao atualizar favorito');
    }
  };

  const buscarNoTexto = () => {
    if (!buscaInterna.trim()) {
      setResultadosBusca([]);
      return;
    }
    
    const termo = buscaInterna.toLowerCase();
    const linhas = textoExtraido.split('\n');
    const resultados = [];
    
    linhas.forEach((linha, index) => {
      if (linha.toLowerCase().includes(termo)) {
        resultados.push({ linha: index + 1, texto: linha.trim() });
      }
    });
    
    setResultadosBusca(resultados);
    if (resultados.length > 0) {
      toast.success(`${resultados.length} ocorrência(s) encontrada(s)`);
    } else {
      toast.info('Nenhuma ocorrência encontrada');
    }
  };

  const adicionarTag = () => {
    if (!novaTag.trim()) return;
    const tagsAtuais = tags.split(',').map(t => t.trim()).filter(t => t);
    if (tagsAtuais.includes(novaTag.trim())) {
      toast.info('Tag já existe');
      return;
    }
    setTags([...tagsAtuais, novaTag.trim()].join(', '));
    setNovaTag('');
  };

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onVoltar} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorita}
            className="hover:bg-amber-50"
          >
            <Star className={`w-5 h-5 ${nota.favorita ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
          </Button>
        </div>
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
              Tags de Organização
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTag())}
                placeholder="Adicionar nova tag..."
              />
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={adicionarTag}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.split(',').map(t => t.trim()).filter(t => t).map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="gap-1 pr-1 cursor-pointer hover:bg-slate-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
                      tagsArray.splice(idx, 1);
                      setTags(tagsArray.join(', '));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-4 h-4" />
              <div>
                <div>Criado: {format(new Date(nota.created_date), 'dd/MM/yyyy HH:mm')}</div>
                {nota.ultima_modificacao && (
                  <div className="text-slate-400">
                    Última modificação: {format(new Date(nota.ultima_modificacao), 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
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

      {/* Processador removido temporariamente */}

      {/* Busca Interna */}
      <Card className="border-2 border-blue-500">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar dentro desta nota..."
                value={buscaInterna}
                onChange={(e) => setBuscaInterna(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarNoTexto()}
                className="pl-10"
              />
            </div>
            <Button onClick={buscarNoTexto} disabled={!buscaInterna.trim()}>
              Buscar
            </Button>
            {buscaInterna && (
              <Button variant="outline" onClick={() => { setBuscaInterna(''); setResultadosBusca([]); }}>
                Limpar
              </Button>
            )}
          </div>
          
          {resultadosBusca.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-slate-700">
                {resultadosBusca.length} resultado(s):
              </p>
              {resultadosBusca.map((resultado, idx) => (
                <div key={idx} className="p-2 bg-blue-50 rounded text-sm">
                  <span className="text-xs text-blue-600 font-medium">Linha {resultado.linha}: </span>
                  <span className="text-slate-700">{resultado.texto}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor de Texto */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Texto Extraído/Transcrito
              </label>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {textoExtraido.length} caracteres
                </Badge>
                <Badge variant="outline">
                  {textoExtraido.split(/\s+/).filter(Boolean).length} palavras
                </Badge>
              </div>
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