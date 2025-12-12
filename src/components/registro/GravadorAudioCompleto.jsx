import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Loader2, Upload, X, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GravadorAudioCompleto({ onTranscricao, onArquivoProcessado }) {
  const [gravando, setGravando] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [tocando, setTocando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [duracao, setDuracao] = useState(0);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(null);
  const intervaloRef = useRef(null);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
    } catch (error) {
      alert('Erro ao acessar microfone: ' + error.message);
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setGravando(false);
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    }
  };

  const toggleReproducao = () => {
    if (!audioElementRef.current) return;

    if (tocando) {
      audioElementRef.current.pause();
      setTocando(false);
    } else {
      audioElementRef.current.play();
      setTocando(true);
    }
  };

  const transcreverAudio = async () => {
    if (!audioBlob) return;

    setTranscrevendo(true);

    try {
      // 1. Upload do arquivo
      const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (onArquivoProcessado) {
        onArquivoProcessado({ url: file_url, tipo: 'audio', nome: file.name });
      }

      // 2. Transcrição via IA
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcreva COMPLETAMENTE este áudio. Retorne APENAS o texto transcrito, preservando pontuação e estrutura.',
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            transcricao: { type: "string" }
          }
        }
      });

      setTranscricao(resultado.transcricao);
      
      if (onTranscricao) {
        onTranscricao(resultado.transcricao, file_url);
      }

      alert('✅ Áudio transcrito com sucesso!');
    } catch (error) {
      alert('❌ Erro ao transcrever: ' + error.message);
    } finally {
      setTranscrevendo(false);
    }
  };

  const processarArquivoExterno = async (file) => {
    setEnviandoArquivo(true);
    setTranscrevendo(true);

    try {
      // Upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (onArquivoProcessado) {
        onArquivoProcessado({ url: file_url, tipo: 'audio', nome: file.name });
      }

      // Transcrição
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcreva COMPLETAMENTE este áudio. Retorne APENAS o texto transcrito.',
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            transcricao: { type: "string" }
          }
        }
      });

      setTranscricao(resultado.transcricao);
      
      if (onTranscricao) {
        onTranscricao(resultado.transcricao, file_url);
      }

      alert('✅ Áudio enviado e transcrito!');
    } catch (error) {
      alert('❌ Erro ao processar: ' + error.message);
    } finally {
      setEnviandoArquivo(false);
      setTranscrevendo(false);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
  };

  const limpar = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setTranscricao('');
    setDuracao(0);
    setTocando(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Mic className="w-5 h-5" />
          Gravação e Transcrição de Áudio
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Gravação */}
        {!audioBlob && (
          <div className="text-center space-y-4">
            {gravando ? (
              <>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-2xl font-mono font-bold text-red-600">
                    {formatarTempo(duracao)}
                  </span>
                </div>
                <Button onClick={pararGravacao} variant="destructive" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  Parar Gravação
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center gap-3">
                  <Button onClick={iniciarGravacao} className="bg-red-600 hover:bg-red-700" size="lg">
                    <Mic className="w-5 h-5 mr-2" />
                    Gravar Áudio
                  </Button>
                  <label>
                    <Button variant="outline" size="lg" disabled={enviandoArquivo} asChild>
                      <div>
                        {enviandoArquivo ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 mr-2" />
                        )}
                        Enviar Arquivo
                      </div>
                    </Button>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) processarArquivoExterno(file);
                      }}
                      disabled={enviandoArquivo}
                    />
                  </label>
                </div>
                <p className="text-sm text-slate-500">
                  Grave diretamente ou envie um arquivo de áudio
                </p>
              </>
            )}
          </div>
        )}

        {/* Player e Transcrição */}
        {audioBlob && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={toggleReproducao}
                >
                  {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div>
                  <p className="text-sm font-medium">Áudio gravado</p>
                  <p className="text-xs text-slate-500">{formatarTempo(duracao)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={limpar}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <audio 
              ref={audioElementRef} 
              src={audioURL} 
              onEnded={() => setTocando(false)}
              className="hidden"
            />

            {!transcricao && (
              <Button 
                onClick={transcreverAudio} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={transcrevendo}
              >
                {transcrevendo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcrevendo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Transcrever com IA
                  </>
                )}
              </Button>
            )}

            {transcricao && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">Transcrição Completa</h4>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{transcricao}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}