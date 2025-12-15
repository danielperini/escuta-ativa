import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileAudio, FileVideo, Image, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const TIPO_ICONE = {
  audio: FileAudio,
  video: FileVideo,
  foto: Image,
  documento: FileText
};

const STATUS_CONFIG = {
  pendente: { color: 'bg-slate-100 text-slate-600', label: 'Pendente' },
  processando: { color: 'bg-blue-100 text-blue-600', label: 'Processando' },
  concluido: { color: 'bg-emerald-100 text-emerald-600', label: 'Concluído' },
  erro: { color: 'bg-red-100 text-red-600', label: 'Erro' }
};

export default function ProcessadorMultimidia({ onTextoExtraido, onTranscricaoTempoReal }) {
  const [arquivos, setArquivos] = useState([]);
  const [processando, setProcessando] = useState(false);

  const adicionarArquivos = (files) => {
    const novosArquivos = Array.from(files).map((file, idx) => {
      let tipo = 'documento';
        const nome = file.name.toLowerCase();

        if (nome.match(/\.(mp3|wav|m4a|ogg|webm|opus|aac|flac|mpeg)$/)) tipo = 'audio';
        else if (nome.match(/\.(mp4|mov|avi|mkv|webm)$/)) tipo = 'video';
        else if (nome.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff)$/)) tipo = 'foto';
        else if (nome.match(/\.(pdf|doc|docx|txt|rtf|odt)$/)) tipo = 'documento';
      
      return {
        id: Date.now() + idx,
        file,
        tipo,
        status: 'pendente',
        progresso: 0,
        transcricao: '',
        erro: null
      };
    });
    
    setArquivos(prev => [...prev, ...novosArquivos]);
  };

  const removerArquivo = (id) => {
    setArquivos(prev => prev.filter(a => a.id !== id));
  };

  const processarTodos = async () => {
    setProcessando(true);
    const arquivosPendentes = arquivos.filter(a => a.status === 'pendente' || a.status === 'erro');
    
    // Processar até 3 arquivos simultaneamente
    const batchSize = 3;
    for (let i = 0; i < arquivosPendentes.length; i += batchSize) {
      const batch = arquivosPendentes.slice(i, i + batchSize);
      await Promise.all(batch.map(arquivo => processarArquivo(arquivo)));
    }
    
    setProcessando(false);
    toast.success('Todos os arquivos foram processados!');
  };

  const processarArquivo = async (arquivo) => {
    try {
      atualizarArquivo(arquivo.id, { status: 'processando', progresso: 10 });
      
      // Notificar início
      if (onTranscricaoTempoReal) {
        onTranscricaoTempoReal(`⏳ Processando ${arquivo.tipo}: ${arquivo.file.name}...`);
      }

      // Upload direto sem converter - manter nome original
      atualizarArquivo(arquivo.id, { progresso: 30 });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo.file });
      
      // Transcrever/extrair
      atualizarArquivo(arquivo.id, { progresso: 60 });
      let prompt = '';
      
      if (arquivo.tipo === 'audio' || arquivo.tipo === 'video') {
        prompt = `Transcreva este ${arquivo.tipo} em português brasileiro. Retorne APENAS o texto transcrito, sem comentários. Use pontuação correta e identifique falantes se houver.`;
      } else if (arquivo.tipo === 'foto') {
        prompt = `Execute OCR completo nesta imagem. Extraia todo texto visível (placas, documentos, anotações, texto manuscrito). Preserve formatação e disposição espacial.`;
        } else {
        prompt = `Extraia TODO o texto deste documento (PDF, DOC, DOCX, TXT). Preserve estrutura completa: títulos, subtítulos, parágrafos, listas, tabelas. Não omita nenhuma seção. Mantenha formatação original.`;
        }

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url]
      });

      if (!resultado || resultado.length < 3) {
        throw new Error('Transcrição vazia ou inválida');
      }

      atualizarArquivo(arquivo.id, { 
        status: 'concluido', 
        progresso: 100, 
        transcricao: resultado,
        url: file_url
      });

      // Enviar para caixa de texto
      const blocoTexto = `\n\n--- ✅ ${arquivo.tipo.toUpperCase()}: ${arquivo.file.name} ---\n${resultado}\n`;
      if (onTextoExtraido) {
        onTextoExtraido(blocoTexto, file_url, arquivo.file.name, arquivo.tipo);
      }
      
      if (onTranscricaoTempoReal) {
        onTranscricaoTempoReal(blocoTexto);
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      atualizarArquivo(arquivo.id, { 
        status: 'erro', 
        erro: error.message,
        progresso: 0
      });
      
      if (onTranscricaoTempoReal) {
        onTranscricaoTempoReal(`❌ Erro ao processar ${arquivo.file.name}: ${error.message}`);
      }
    }
  };

  const atualizarArquivo = (id, updates) => {
    setArquivos(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      adicionarArquivos(files);
    }
  };

  const arquivosPendentes = arquivos.filter(a => a.status === 'pendente' || a.status === 'erro').length;

  return (
    <Card className="border-2 border-[#E31E24]">
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[#E31E24]">
            <Upload className="w-5 h-5" />
            Processador Multimídia em Lote
          </span>
          <Badge variant="secondary">
            {arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Área de Upload */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#E31E24] transition-colors">
          <label className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Clique para selecionar arquivos ou arraste aqui
            </p>
            <p className="text-xs text-slate-500">
              Suporta: Áudio (MP3, WAV, OGG, M4A, WhatsApp), Vídeo (MP4, MOV), Imagens (JPG, PNG), Documentos (PDF, DOC, DOCX, TXT)
            </p>
            <input
              type="file"
              multiple
              accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.rtf,.odt"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>

        {/* Lista de Arquivos */}
        {arquivos.length > 0 && (
          <div className="space-y-3">
            {arquivos.map(arquivo => {
              const Icon = TIPO_ICONE[arquivo.tipo] || FileText;
              const statusConfig = STATUS_CONFIG[arquivo.status];
              
              return (
                <div key={arquivo.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5 text-[#E31E24]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {arquivo.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(arquivo.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig.color}>
                        {arquivo.status === 'processando' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {arquivo.status === 'concluido' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {arquivo.status === 'erro' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {statusConfig.label}
                      </Badge>
                      {arquivo.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerArquivo(arquivo.id)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {arquivo.status === 'processando' && (
                    <div className="space-y-2">
                      <Progress value={arquivo.progresso} className="h-2" />
                      <p className="text-xs text-blue-600">
                        {arquivo.progresso < 30 ? '📤 Enviando...' : 
                         arquivo.progresso < 60 ? '🎙️ Transcrevendo com Whisper...' : 
                         '✨ Finalizando...'}
                      </p>
                    </div>
                  )}
                  
                  {arquivo.erro && (
                    <p className="text-xs text-red-600 mt-2">❌ {arquivo.erro}</p>
                  )}
                  
                  {arquivo.status === 'concluido' && arquivo.transcricao && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      ✅ {arquivo.transcricao.substring(0, 100)}...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ações */}
        {arquivos.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={processarTodos}
              disabled={processando || arquivosPendentes === 0}
              className="flex-1 bg-[#E31E24] hover:bg-[#B01419]"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Processar {arquivosPendentes} Arquivo{arquivosPendentes !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setArquivos([])}
              disabled={processando}
            >
              Limpar Tudo
            </Button>
          </div>
        )}

        <div className="text-xs text-center text-slate-500 space-y-1">
          <p>💡 Processamento automático em lote: até 3 arquivos simultâneos</p>
          <p>🎙️ Transcrição de áudio/vídeo com Whisper AI</p>
          <p>📄 Extração de texto de documentos e imagens (OCR)</p>
          <p>✅ Todo conteúdo é adicionado automaticamente ao registro</p>
        </div>
      </CardContent>
    </Card>
  );
}