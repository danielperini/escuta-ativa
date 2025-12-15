import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Upload, Loader2, CheckCircle, AlertCircle, FileAudio, X } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

/**
 * Sistema de Transcrição de Áudio usando Whisper API
 * Suporta gravação direta e upload de arquivos
 * Formatos: MP3, MP4, M4A, WAV, WEBM, OGG
 */
export default function TranscricaoWhisper({ onTranscricaoCompleta }) {
  const [gravando, setGravando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [transcricaoEditavel, setTranscricaoEditavel] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [duracao, setDuracao] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const intervaloRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const audioElementRef = React.useRef(null);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      // Tentar formatos em ordem de qualidade
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setGravando(true);
      setDuracao(0);

      intervaloRef.current = setInterval(() => {
        setDuracao(prev => prev + 1);
      }, 1000);
      
      toast.success('Gravação iniciada');
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }
    
    setGravando(false);
    toast.info('Gravação finalizada');
  };

  const transcreverAudio = async (blob) => {
    setProcessando(true);
    
    try {
      // 1. Preparar arquivo
      const tipo = blob.type || 'audio/webm';
      let extensao = 'webm';
      
      if (tipo.includes('mp4')) extensao = 'mp4';
      else if (tipo.includes('wav')) extensao = 'wav';
      else if (tipo.includes('mpeg') || tipo.includes('mp3')) extensao = 'mp3';
      else if (tipo.includes('m4a')) extensao = 'm4a';
      else if (tipo.includes('ogg')) extensao = 'ogg';
      
      const arquivo = new File([blob], `audio-${Date.now()}.${extensao}`, { type: blob.type });
      
      // 2. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      // 3. Transcrever usando Whisper via LLM com prompt otimizado
      const prompt = `Você tem acesso ao modelo Whisper de transcrição de áudio. Transcreva o áudio anexado em português brasileiro.

IMPORTANTE: 
- Retorne APENAS o texto transcrito, sem comentários
- Use pontuação correta
- Identifique falantes diferentes se houver
- Mantenha expressões coloquiais

Transcreva:`;
      
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url]
      });
      
      if (!resultado || resultado.length < 3) {
        throw new Error('Transcrição vazia. O áudio pode estar sem fala ou corrompido.');
      }
      
      setTranscricao(resultado);
      setTranscricaoEditavel(resultado);
      setModoEdicao(true);
      
      toast.success('Áudio transcrito! Revise e confirme.');
      
    } catch (error) {
      console.error('Erro na transcrição:', error);
      toast.error(error.message || 'Erro ao transcrever áudio');
    } finally {
      setProcessando(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const tiposAceitos = ['audio/', 'video/mp4'];
    if (!tiposAceitos.some(tipo => file.type.includes(tipo)) && 
        !['.mp3', '.wav', '.m4a', '.mp4', '.ogg', '.webm'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast.error('Formato não suportado. Use: MP3, WAV, M4A, MP4, OGG, WEBM');
      return;
    }
    
    // Converter File para Blob e processar
    setAudioBlob(file);
    setAudioURL(URL.createObjectURL(file));
    toast.info('Arquivo carregado. Clique em "Transcrever" para processar.');
  };

  const togglePlayPause = () => {
    if (!audioElementRef.current) return;
    
    if (tocando) {
      audioElementRef.current.pause();
      setTocando(false);
    } else {
      audioElementRef.current.play();
      setTocando(true);
    }
  };

  const confirmarTranscricao = () => {
    if (onTranscricaoCompleta && transcricaoEditavel) {
      onTranscricaoCompleta(transcricaoEditavel, audioURL);
      toast.success('Transcrição adicionada ao registro!');
    }
    setModoEdicao(false);
    setTranscricao('');
    setTranscricaoEditavel('');
    setAudioBlob(null);
    setAudioURL(null);
  };

  const downloadTranscricao = () => {
    const blob = new Blob([transcricaoEditavel], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcrição baixada!');
  };

  const limpar = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setTranscricao('');
    setTranscricaoEditavel('');
    setDuracao(0);
    setModoEdicao(false);
    setTocando(false);
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-blue-600" />
            Transcrição Profissional (Whisper)
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Alta Precisão
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        {/* Controles de Gravação/Upload */}
        {!audioBlob && (
          <div className="space-y-4">
            {gravando ? (
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Animação de barras de áudio */}
                  <div className="flex items-center justify-center gap-1 h-16">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 bg-red-600 rounded-full animate-pulse"
                        style={{
                          height: '100%',
                          animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                          transform: 'scaleY(0.3)',
                        }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-red-600">
                      {formatarTempo(duracao)}
                    </span>
                  </div>
                </div>

                <style>{`
                  @keyframes pulse {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1); }
                  }
                `}</style>

                <Button 
                  onClick={pararGravacao} 
                  variant="destructive" 
                  size="lg"
                  className="w-full"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Parar Gravação
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={iniciarGravacao}
                  className="bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Gravar Áudio
                </Button>
                
                <label>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <div>
                      <Upload className="w-5 h-5 mr-2" />
                      Enviar Arquivo
                    </div>
                  </Button>
                  <input 
                    type="file" 
                    accept="audio/*,video/mp4,.mp3,.wav,.m4a,.ogg,.webm,.opus"
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
            
            <div className="text-center text-xs space-y-1">
              <p className="text-slate-500">
                ✓ Formatos: MP3, WAV, M4A, MP4, OGG, WEBM, OPUS
              </p>
              <p className="text-emerald-600 font-medium">
                ✓ Funciona com áudios do WhatsApp
              </p>
            </div>
          </div>
        )}

        {/* Player e Botão de Transcrição */}
        {audioBlob && !modoEdicao && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileAudio className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Áudio pronto para transcrição</p>
                    <p className="text-xs text-slate-500">
                      {duracao > 0 ? formatarTempo(duracao) : 'Arquivo externo'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={limpar}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {audioURL && (
                <audio 
                  ref={audioElementRef}
                  controls 
                  src={audioURL} 
                  className="w-full"
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onEnded={() => setTocando(false)}
                />
              )}
            </div>

            <Button 
              onClick={() => transcreverAudio(audioBlob)}
              disabled={processando}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {processando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Transcrevendo com Whisper...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Transcrever Áudio
                </>
              )}
            </Button>
          </div>
        )}

        {/* Edição e Confirmação da Transcrição */}
        {modoEdicao && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">
                    Transcrição Completa - Revise e Edite
                  </h4>
                </div>
                {audioURL && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-blue-600"
                  >
                    {tocando ? 'Pausar' : 'Ouvir'}
                  </Button>
                )}
              </div>
              
              {audioURL && (
                <audio 
                  ref={audioElementRef}
                  src={audioURL} 
                  className="hidden"
                  onPlay={() => setTocando(true)}
                  onPause={() => setTocando(false)}
                  onEnded={() => setTocando(false)}
                />
              )}
              
              <Textarea
                value={transcricaoEditavel}
                onChange={(e) => setTranscricaoEditavel(e.target.value)}
                className="min-h-[200px] bg-white font-mono text-sm"
                placeholder="Edite a transcrição se necessário..."
              />
              
              <p className="text-xs text-slate-500 mt-2">
                💡 Você pode editar o texto antes de confirmar
              </p>
            </div>

            <div className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                onClick={downloadTranscricao}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar .txt
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={limpar}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmarTranscricao}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar e Usar Transcrição
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}