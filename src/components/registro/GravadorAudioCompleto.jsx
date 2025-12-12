import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, Loader2, Upload, X, CheckCircle, Sparkles } from 'lucide-react';
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

  const transcreverAudio = async (tentativa = 1) => {
    if (!audioBlob) return;

    setTranscrevendo(true);

    try {
      // 1. Upload do arquivo
      const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (onArquivoProcessado) {
        onArquivoProcessado({ url: file_url, tipo: 'audio', nome: file.name });
      }

      // 2. Transcrição via IA com suporte a múltiplos formatos
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de transcrição de áudio profissional.

TAREFA: Transcreva COMPLETAMENTE o áudio fornecido.

FORMATOS ACEITOS: .ogg, .opus, .mp3, .wav, .m4a, .aac, .webm (incluindo áudios do WhatsApp)

INSTRUÇÕES:
1. Transcreva TODO o conteúdo falado
2. Preserve pontuação natural
3. Identifique mudanças de falante se houver
4. Mantenha estrutura de parágrafos quando apropriado
5. Corrija erros gramaticais óbvios mantendo o sentido original

RETORNE: Apenas o texto transcrito, sem comentários adicionais.`,
        file_urls: [file_url]
      });

      const textoTranscrito = typeof resultado === 'string' ? resultado : resultado.transcricao;

      if (textoTranscrito && textoTranscrito.trim()) {
        setTranscricao(textoTranscrito);
        
        // Garantir que a callback é chamada
        if (onTranscricao) {
          onTranscricao(textoTranscrito, file_url);
        }

        // Limpar após sucesso
        setTimeout(() => {
          limpar();
        }, 2000);

        alert('✅ Transcrição adicionada ao texto consolidado!');
      } else {
        throw new Error('Transcrição vazia ou áudio sem conteúdo de fala');
      }
    } catch (error) {
      console.error(`Erro na tentativa ${tentativa}:`, error);
      
      // Retry automático com espera progressiva
      if (tentativa < 3) {
        const espera = tentativa * 2000; // 2s, 4s
        alert(`⚠️ Tentando novamente em ${espera/1000}s... (tentativa ${tentativa}/3)`);
        await new Promise(resolve => setTimeout(resolve, espera));
        return transcreverAudio(tentativa + 1);
      }
      
      alert(
        `❌ Não foi possível transcrever após 3 tentativas.\n\n` +
        `Motivo: ${error.message}\n\n` +
        `Soluções:\n` +
        `✓ Grave novamente com melhor qualidade de áudio\n` +
        `✓ Fale mais próximo do microfone\n` +
        `✓ Reduza ruídos de fundo\n` +
        `✓ Tente converter para .mp3 usando conversor online\n` +
        `✓ Use o recurso de Transcrição em Tempo Real (Chrome/Edge)`
      );
    } finally {
      setTranscrevendo(false);
    }
  };

  const processarArquivoExterno = async (file, tentativa = 1) => {
    setEnviandoArquivo(true);
    setTranscrevendo(true);

    try {
      // Validar formato
      const formatosSuportados = ['.ogg', '.opus', '.mp3', '.wav', '.m4a', '.aac', '.webm'];
      const extensao = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!formatosSuportados.some(f => extensao.endsWith(f))) {
        throw new Error(`Formato ${extensao} não reconhecido. Use: ${formatosSuportados.join(', ')}`);
      }

      // Upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (onArquivoProcessado) {
        onArquivoProcessado({ url: file_url, tipo: 'audio', nome: file.name });
      }

      // Transcrição com suporte multi-formato
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de transcrição de áudio profissional.

ARQUIVO: ${file.name} (formato ${extensao})

TAREFA: Transcreva COMPLETAMENTE o áudio fornecido.

IMPORTANTE: 
- Este arquivo pode estar em formato .ogg ou .opus (comum em mensagens de WhatsApp)
- Processe o áudio independente do formato original
- Áudios do WhatsApp frequentemente têm compressão alta

INSTRUÇÕES:
1. Transcreva TODO o conteúdo falado, mesmo com ruídos
2. Preserve pontuação e estrutura natural
3. Se houver múltiplos falantes, indique as mudanças
4. Ignore sons de fundo, transcreva apenas a fala
5. Se o áudio estiver de baixa qualidade, faça o melhor possível

RETORNE: Apenas o texto transcrito, sem comentários.`,
        file_urls: [file_url]
      });

      const textoTranscrito = typeof resultado === 'string' ? resultado : resultado.transcricao;

      if (textoTranscrito && textoTranscrito.trim()) {
        setTranscricao(textoTranscrito);
        
        // Criar blob para reprodução primeiro
        const response = await fetch(file_url);
        const blob = await response.blob();
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));

        // Garantir que a callback é chamada
        if (onTranscricao) {
          onTranscricao(textoTranscrito, file_url);
        }

        // Limpar após sucesso
        setTimeout(() => {
          limpar();
        }, 2000);

        alert('✅ Transcrição adicionada ao texto consolidado!');
      } else {
        throw new Error('Transcrição vazia - áudio sem conteúdo de fala ou corrompido');
      }
    } catch (error) {
      console.error(`Erro na tentativa ${tentativa}:`, error);
      
      // Retry com espera progressiva
      if (tentativa < 3) {
        const espera = tentativa * 2000;
        alert(`⚠️ Processando formato ${extensao}... Tentativa ${tentativa}/3 (aguarde ${espera/1000}s)`);
        await new Promise(resolve => setTimeout(resolve, espera));
        return processarArquivoExterno(file, tentativa + 1);
      }
      
      alert(
        `❌ Não foi possível processar após 3 tentativas.\n\n` +
        `📄 Arquivo: ${file.name}\n` +
        `📊 Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB\n` +
        `⚠️ Motivo: ${error.message}\n\n` +
        `💡 Soluções:\n\n` +
        `1️⃣ ÁUDIOS DO WHATSAPP:\n` +
        `   • Encaminhe como DOCUMENTO (não como áudio)\n` +
        `   • Ou use "Gravar Áudio" no app\n\n` +
        `2️⃣ CONVERSÃO DE FORMATO:\n` +
        `   • Use https://cloudconvert.com/ogg-to-mp3\n` +
        `   • Converta para .mp3 ou .wav\n\n` +
        `3️⃣ OUTRAS OPÇÕES:\n` +
        `   • Grave diretamente no app (botão "Gravar Áudio")\n` +
        `   • Use "Transcrição em Tempo Real" (Chrome/Edge)\n` +
        `   • Verifique se o arquivo não está corrompido`
      );
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
                      accept="audio/*,.ogg,.opus,.mp3,.wav,.m4a,.aac,.webm" 
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
                <p className="text-xs text-slate-400 mt-1">
                  Suportados: .mp3, .wav, .ogg, .opus, .m4a, .aac, .webm
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  ✓ Aceita áudios do WhatsApp (.ogg/.opus)
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