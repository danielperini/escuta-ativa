import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Pause, Play, Download, Trash2, Volume2, AlertCircle, Wifi } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente de transcrição usando Web Speech API (gratuito e offline)
 * Funciona apenas em navegadores compatíveis (Chrome, Edge, Safari)
 */
export default function TranscricaoNavegador({ onTranscricaoCompleta, onTranscricaoTempoReal }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [transcricaoFinal, setTranscricaoFinal] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [idioma, setIdioma] = useState('pt-BR');
  const [duracao, setDuracao] = useState(0);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Verificar suporte do navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = idioma;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscricaoFinal(prev => prev + finalTranscript);
          setTranscricao(interimTranscript);
          
          if (onTranscricaoTempoReal) {
            onTranscricaoTempoReal(finalTranscript);
          }
        } else {
          setTranscricao(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'no-speech') {
          toast.error('Nenhuma fala detectada. Tente novamente.');
        } else if (event.error === 'network') {
          toast.error('Erro de rede. Verifique sua conexão.');
        } else {
          toast.error('Erro no reconhecimento: ' + event.error);
        }
        stopRecording();
      };

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          // Reiniciar automaticamente se ainda estiver gravando
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [idioma, isRecording, isPaused]);

  const startRecording = async () => {
    if (!recognitionRef.current) return;

    try {
      // Pedir permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognitionRef.current.lang = idioma;
      recognitionRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuracao(0);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuracao(prev => prev + 1);
      }, 1000);

      toast.success('Gravação iniciada! Comece a falar...');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsPaused(true);
      clearInterval(timerRef.current);
      toast.info('Gravação pausada');
    }
  };

  const resumeRecording = () => {
    if (recognitionRef.current && isRecording && isPaused) {
      recognitionRef.current.start();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setDuracao(prev => prev + 1);
      }, 1000);
      
      toast.success('Gravação retomada');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    clearInterval(timerRef.current);

    const textoCompleto = (transcricaoFinal + ' ' + transcricao).trim();
    
    if (textoCompleto) {
      if (onTranscricaoCompleta) {
        onTranscricaoCompleta(textoCompleto);
      }
      toast.success('Transcrição concluída!');
    }
  };

  const limpar = () => {
    setTranscricao('');
    setTranscricaoFinal('');
    setDuracao(0);
    setIsRecording(false);
    setIsPaused(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    clearInterval(timerRef.current);
  };

  const downloadTxt = () => {
    const textoCompleto = (transcricaoFinal + ' ' + transcricao).trim();
    const blob = new Blob([textoCompleto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Card className="border-2 border-amber-500">
        <CardHeader className="bg-amber-50">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5" />
            Navegador não compatível
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">
            Seu navegador não suporta reconhecimento de voz. 
            Use Chrome, Edge ou Safari para acessar este recurso.
          </p>
        </CardContent>
      </Card>
    );
  }

  const textoCompleto = (transcricaoFinal + ' ' + transcricao).trim();

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-600" />
            Transcrição no Navegador
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Gratuito
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Offline
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Reconhecimento de Voz do Navegador</p>
              <ul className="text-xs space-y-1">
                <li>✓ Totalmente gratuito</li>
                <li>✓ Funciona offline (após primeira carga)</li>
                <li>✓ Transcrição em tempo real</li>
                <li>✓ Suporta múltiplos idiomas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seletor de idioma */}
        {!isRecording && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Idioma da Gravação
            </label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="pt-BR">🇧🇷 Português (Brasil)</option>
              <option value="en-US">🇺🇸 Inglês (EUA)</option>
              <option value="es-ES">🇪🇸 Espanhol (Espanha)</option>
              <option value="fr-FR">🇫🇷 Francês</option>
              <option value="de-DE">🇩🇪 Alemão</option>
              <option value="it-IT">🇮🇹 Italiano</option>
            </select>
          </div>
        )}

        {/* Controles de gravação */}
        {!isRecording && !textoCompleto && (
          <Button
            onClick={startRecording}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            size="lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Iniciar Gravação
          </Button>
        )}

        {isRecording && (
          <div className="space-y-4">
            {/* Status visual */}
            <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-lg border-2 border-blue-500">
              <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {isPaused ? 'Pausado' : 'Gravando...'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatarTempo(duracao)}
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              {!isPaused ? (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              ) : (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Retomar
                </Button>
              )}
              <Button
                onClick={stopRecording}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Parar
              </Button>
            </div>
          </div>
        )}

        {/* Preview da transcrição */}
        {(transcricao || transcricaoFinal) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Transcrição em Tempo Real
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                <span className="text-slate-900">{transcricaoFinal}</span>
                <span className="text-slate-400 italic">{transcricao}</span>
              </p>
            </div>
          </div>
        )}

        {/* Ações finais */}
        {textoCompleto && !isRecording && (
          <div className="flex gap-2">
            <Button
              onClick={downloadTxt}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar TXT
            </Button>
            <Button
              onClick={limpar}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        )}

        {/* Aviso */}
        <div className="text-xs text-center text-slate-500">
          💡 A transcrição acontece localmente no seu navegador, sem enviar dados para servidores externos
        </div>
      </CardContent>
    </Card>
  );
}