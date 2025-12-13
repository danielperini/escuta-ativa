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
      
      // Tentar formatos em ordem de preferência: MP4, WAV, MP3, WEBM
      let mimeType = 'audio/webm';
      let extensao = 'webm';
      
      const formatosPreferidos = [
        { type: 'audio/mp4', ext: 'mp4' },
        { type: 'audio/wav', ext: 'wav' },
        { type: 'audio/mpeg', ext: 'mp3' },
        { type: 'audio/webm;codecs=opus', ext: 'webm' }
      ];
      
      for (const formato of formatosPreferidos) {
        if (MediaRecorder.isTypeSupported(formato.type)) {
          mimeType = formato.type;
          extensao = formato.ext;
          console.log(`✓ Usando formato: ${mimeType}`);
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
      // Detectar tipo do blob e criar arquivo correspondente
      const tipo = audioBlob.type || 'audio/webm';
      let extensao = 'webm';
      
      if (tipo.includes('mp4')) extensao = 'mp4';
      else if (tipo.includes('wav')) extensao = 'wav';
      else if (tipo.includes('mpeg') || tipo.includes('mp3')) extensao = 'mp3';
      
      // 1. Upload do arquivo com tipo correto
      const file = new File([audioBlob], `audio-${Date.now()}.${extensao}`, { type: audioBlob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      if (onArquivoProcessado) {
        onArquivoProcessado({ url: file_url, tipo: 'audio', nome: file.name });
      }

      // 2. Transcrição via IA otimizada para áudio comprimido
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de transcrição de áudio profissional especializado em áudio comprimido.

FONTE: Gravação direta do navegador (formato WebM/Opus)

TAREFA: Transcreva COMPLETAMENTE o áudio fornecido.

INSTRUÇÕES:
1. Transcreva TODO o conteúdo falado
2. Preserve pontuação natural da fala
3. Se houver múltiplos falantes, indique mudanças [Pessoa 1], [Pessoa 2]
4. Ignore ruídos de fundo, foque apenas na fala
5. Mantenha estrutura de parágrafos quando apropriado
6. Para palavras ininteligíveis, use [inaudível]
7. Não adicione interpretações, transcreva literalmente

RETORNE APENAS: O texto transcrito, sem comentários.`,
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

      // Transcrição com instruções específicas para áudio do WhatsApp
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de transcrição de áudio profissional especializado em áudio comprimido.

ARQUIVO: ${file.name}
FORMATO: ${extensao}
ORIGEM POSSÍVEL: WhatsApp, Telegram, gravação direta

IMPORTANTE - ÁUDIO DO WHATSAPP:
- Formato .ogg/.opus com codec Opus
- Alta compressão (16-32 kbps)
- Pode conter ruídos de fundo
- Qualidade pode ser limitada

TAREFA: Transcreva COMPLETAMENTE o áudio fornecido.

INSTRUÇÕES:
1. Transcreva TODO o conteúdo falado, mesmo com qualidade baixa
2. Ignore ruídos, ecos, e sons de fundo - foque na fala
3. Preserve pontuação e estrutura natural da fala
4. Se houver múltiplos falantes, indique [Pessoa 1], [Pessoa 2]
5. Se alguma palavra for ininteligível, use [inaudível]
6. Faça o melhor possível mesmo com áudio de baixa qualidade
7. Não adicione interpretações, apenas transcreva literalmente

RETORNE APENAS: O texto transcrito, sem comentários ou análise.`,
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
        `❌ Erro ao processar áudio após 3 tentativas.\n\n` +
        `📄 Arquivo: ${file.name}\n` +
        `📊 Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB\n` +
        `⚠️ Erro: ${error.message}\n\n` +
        `💡 SOLUÇÕES PARA ÁUDIO DO WHATSAPP:\n\n` +
        `1️⃣ MÉTODO MAIS CONFIÁVEL:\n` +
        `   • Reproduza o áudio do WhatsApp\n` +
        `   • Use "Gravar Áudio" no app enquanto toca\n` +
        `   • Funciona 100% das vezes\n\n` +
        `2️⃣ CONVERTER FORMATO:\n` +
        `   • Acesse: https://cloudconvert.com/ogg-to-mp3\n` +
        `   • Faça upload do áudio .ogg do WhatsApp\n` +
        `   • Baixe o .mp3 convertido\n` +
        `   • Envie o .mp3 aqui\n\n` +
        `3️⃣ TRANSCRIÇÃO EM TEMPO REAL:\n` +
        `   • Use "Transcrição Tempo Real" (Chrome/Edge)\n` +
        `   • Reproduza o áudio enquanto transcreve\n` +
        `   • Não precisa de upload\n\n` +
        `⚠️ NOTA: Áudios .ogg/.opus do WhatsApp têm compressão alta\n` +
        `e podem não ser processados corretamente pela IA.`
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={limpar}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Deletar
                </Button>
              </div>
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