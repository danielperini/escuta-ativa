import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Mic, X, FileAudio, FileVideo, Image as ImageIcon, FileText, Loader2, CheckCircle2, Camera, Video } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessadorCaderno({ notaId, onProcessamentoCompleto }) {
  const [arquivos, setArquivos] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [gravando, setGravando] = useState(false);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const streamRef = React.useRef(null);

  const adicionarArquivos = (files) => {
    const novosArquivos = Array.from(files).map((file, idx) => {
      let tipo = 'documento';
      const nome = file.name.toLowerCase();
      
      if (nome.match(/\.(mp3|wav|m4a|ogg|webm|opus|aac|flac)$/)) tipo = 'audio';
      else if (nome.match(/\.(mp4|mov|avi|mkv|webm)$/)) tipo = 'video';
      else if (nome.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) tipo = 'foto';
      
      return {
        id: Date.now() + idx,
        file,
        tipo,
        status: 'pendente',
        progresso: 0
      };
    });
    
    setArquivos(prev => [...prev, ...novosArquivos]);
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([blob], `gravacao-${Date.now()}.wav`, { type: 'audio/wav' });
        adicionarArquivos([file]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setGravando(true);
      toast.success('Gravação iniciada');
    } catch (error) {
      toast.error('Erro ao acessar microfone');
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setGravando(false);
  };

  const processarTodos = async () => {
    setProcessando(true);
    
    try {
      // Upload de arquivos
      const arquivosParaProcessar = [];
      for (const arquivo of arquivos) {
        atualizarArquivo(arquivo.id, { status: 'processando', progresso: 50 });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo.file });
        
        arquivosParaProcessar.push({
          url: file_url,
          nome: arquivo.file.name,
          tipo: arquivo.tipo,
          tamanho: arquivo.file.size
        });
        
        atualizarArquivo(arquivo.id, { progresso: 100, status: 'concluido' });
      }

      // Processar via backend
      const response = await base44.functions.invoke('processarConteudoCaderno', {
        cadernoNotaId: notaId,
        arquivos: arquivosParaProcessar
      });

      if (response.data.success) {
        toast.success('Arquivos processados com sucesso!');
        onProcessamentoCompleto(response.data.texto_extraido, arquivosParaProcessar);
        setArquivos([]);
      }
    } catch (error) {
      toast.error('Erro ao processar arquivos: ' + error.message);
    } finally {
      setProcessando(false);
    }
  };

  const atualizarArquivo = (id, updates) => {
    setArquivos(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      audio: FileAudio,
      video: FileVideo,
      foto: ImageIcon,
      documento: FileText
    };
    return icons[tipo] || FileText;
  };

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
        {/* Área de Upload Estilo RegistroUnificado */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#E31E24] transition-colors">
          <div className="w-16 h-16 rounded-full bg-[#E31E24]/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-[#E31E24]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Envie arquivos ou grave áudio</h3>
          <p className="text-sm text-slate-500 mb-6">Todos os arquivos serão convertidos em texto editável</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <button
              onClick={gravando ? pararGravacao : iniciarGravacao}
              disabled={processando}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:bg-slate-50 hover:border-[#E31E24] transition-all bg-gradient-to-br from-red-50 to-red-100 disabled:opacity-50"
            >
              <Mic className={`w-8 h-8 mb-2 ${gravando ? 'text-red-600 animate-pulse' : 'text-red-600'}`} />
              <span className="text-sm font-medium">{gravando ? 'Parar' : 'Gravar Áudio'}</span>
              <span className="text-xs text-slate-400 mt-1">Transcrição automática</span>
            </button>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all bg-blue-50">
              <Camera className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Foto/OCR</span>
              <span className="text-xs text-slate-400 mt-1">Extrai texto</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => adicionarArquivos(e.target.files)}
                capture="environment"
              />
            </label>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all bg-purple-50">
              <Video className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Vídeo</span>
              <span className="text-xs text-slate-400 mt-1">Transcreve áudio</span>
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={(e) => adicionarArquivos(e.target.files)}
                capture="environment"
              />
            </label>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#E31E24] transition-all">
              <FileText className="w-8 h-8 text-[#E31E24] mb-2" />
              <span className="text-sm font-medium">PDF/Doc</span>
              <span className="text-xs text-slate-400 mt-1">Extrai texto</span>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,audio/*" 
                multiple
                className="hidden" 
                onChange={(e) => adicionarArquivos(e.target.files)}
              />
            </label>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            ✓ Aceita arquivos do WhatsApp (.ogg, .opus) • MP3 • M4A • WAV • WEBM
          </p>
        </div>

        {/* Lista de Arquivos */}
        {arquivos.length > 0 && (
          <div className="space-y-3">
            {arquivos.map(arquivo => {
              const Icon = getTipoIcon(arquivo.tipo);
              return (
                <div key={arquivo.id} className="p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium truncate">
                        {arquivo.file.name}
                      </span>
                    </div>
                    {arquivo.status === 'pendente' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setArquivos(prev => prev.filter(a => a.id !== arquivo.id))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {arquivo.status === 'concluido' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  {arquivo.status === 'processando' && (
                    <Progress value={arquivo.progresso} className="h-2" />
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
              disabled={processando}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Processar e Transcrever</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setArquivos([])}
              disabled={processando}
            >
              Limpar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}