import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TranscricaoNativa({ onTranscricao }) {
  const [gravando, setGravando] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [suportado, setSuportado] = useState(true);
  const [duracao, setDuracao] = useState(0);
  const recognitionRef = useRef(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    // Verificar suporte do navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSuportado(false);
      return;
    }

    // Configurar reconhecimento de fala
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcricaoFinal = '';
      let transcricaoInterina = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcricaoFinal += transcript + ' ';
        } else {
          transcricaoInterina += transcript;
        }
      }

      if (transcricaoFinal) {
        setTranscricao(prev => prev + transcricaoFinal);
      }
    };

    recognition.onerror = (event) => {
      console.error('Erro na transcrição:', event.error);
      if (event.error === 'no-speech') {
        // Silêncio prolongado, continuar
        recognition.start();
      } else {
        pararGravacao();
        alert(`Erro: ${event.error}. Tente novamente.`);
      }
    };

    recognition.onend = () => {
      if (gravando) {
        recognition.start(); // Reiniciar para gravação contínua
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [gravando]);

  const iniciarGravacao = () => {
    if (!recognitionRef.current) return;

    setTranscricao('');
    setDuracao(0);
    setGravando(true);

    try {
      recognitionRef.current.start();
      
      intervaloRef.current = setInterval(() => {
        setDuracao(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert('Erro ao iniciar gravação: ' + error.message);
      setGravando(false);
    }
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
    }
    
    setGravando(false);

    if (transcricao && onTranscricao) {
      onTranscricao(transcricao);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
  };

  if (!suportado) {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertCircle className="w-5 h-5" />
            Transcrição Não Suportada
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-slate-700 mb-3">
            Seu navegador não suporta transcrição automática de voz.
          </p>
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-xs text-blue-900 font-semibold mb-1">Recomendações:</p>
            <ul className="text-xs text-blue-800 list-disc list-inside space-y-1">
              <li>Use Google Chrome ou Microsoft Edge</li>
              <li>Ou grave externamente e envie o arquivo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Mic className="w-5 h-5" />
          Transcrição em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="text-center">
          {gravando ? (
            <div className="space-y-4">
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
            </div>
          ) : (
            <Button onClick={iniciarGravacao} className="bg-red-600 hover:bg-red-700" size="lg">
              <Mic className="w-5 h-5 mr-2" />
              Iniciar Gravação e Transcrição
            </Button>
          )}
        </div>

        {transcricao && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {gravando ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
              <h4 className="font-semibold text-emerald-900">
                {gravando ? 'Transcrevendo...' : 'Transcrição Completa'}
              </h4>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{transcricao}</p>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">
          ✓ Transcrição automática em tempo real
          <br />
          Funciona apenas em Chrome e Edge
        </p>
      </CardContent>
    </Card>
  );
}