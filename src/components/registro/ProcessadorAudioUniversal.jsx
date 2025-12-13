import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, CheckCircle, FileAudio, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const FORMATOS_SUPORTADOS = [
  'audio/webm',
  'audio/ogg',
  'audio/mpeg', // MP3
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'video/mp4', // WhatsApp pode enviar como vídeo
  'video/quicktime'
];

export default function ProcessadorAudioUniversal({ onTranscricaoCompleta }) {
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [progresso, setProgresso] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato
    const tipoValido = FORMATOS_SUPORTADOS.some(formato => 
      file.type.includes(formato.split('/')[1]) || 
      file.name.toLowerCase().endsWith(`.${formato.split('/')[1]}`)
    );

    if (!tipoValido) {
      toast.error('Formato de áudio não suportado. Use: MP3, WAV, OGG, M4A, AAC, MP4');
      return;
    }

    setArquivo(file);
    setTranscricao('');
  };

  const processarAudio = async () => {
    if (!arquivo) return;
    
    setProcessando(true);
    setTranscricao('');
    setProgresso('Enviando arquivo...');
    
    try {
      // 1. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      setProgresso('Arquivo enviado. Processando transcrição...');
      
      // 2. Transcrição via LLM com instruções robustas para PT-BR
      const prompt = `Você é um transcritor profissional especializado em PORTUGUÊS BRASILEIRO.

TAREFA: Transcreva o áudio anexado seguindo estas instruções:

1. Transcreva TODO o conteúdo de forma LITERAL e PRECISA
2. Use pontuação correta (vírgulas, pontos, exclamações)
3. Identifique falantes diferentes (Pessoa 1:, Pessoa 2:, etc.)
4. Mantenha expressões coloquiais brasileiras
5. Organize em parágrafos para facilitar leitura
6. Use [inaudível] para trechos incompreensíveis
7. Corrija erros óbvios sem mudar o sentido

IMPORTANTE: Retorne APENAS a transcrição em português, sem comentários ou explicações.`;
      
      let resultado;
      let tentativas = 0;
      const maxTentativas = 3;
      
      while (tentativas < maxTentativas) {
        try {
          resultado = await base44.integrations.Core.InvokeLLM({
            prompt,
            file_urls: [file_url]
          });
          break; // Sucesso, sair do loop
        } catch (error) {
          tentativas++;
          if (tentativas >= maxTentativas) {
            throw new Error(`Falha após ${maxTentativas} tentativas: ${error.message}`);
          }
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setTranscricao(resultado);
      setProgresso('Transcrição concluída!');
      
      if (onTranscricaoCompleta) {
        onTranscricaoCompleta(resultado, file_url);
      }
      
      toast.success('Áudio transcrito com sucesso!');
      
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      setProgresso('');
      toast.error('Erro ao processar áudio. Verifique o arquivo e tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  const limpar = () => {
    setArquivo(null);
    setTranscricao('');
    setProgresso('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-[#2D6A4F]" />
            Upload de Áudio (Todos os Formatos)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept="audio/*,video/mp4,video/quicktime,.ogg,.mp3,.wav,.m4a,.aac,.webm"
              onChange={handleFileChange}
              disabled={processando}
              className="cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">
              ✓ Formatos suportados: MP3, WAV, OGG, M4A, AAC, WEBM, MP4 (WhatsApp)
            </p>
          </div>

          {arquivo && !transcricao && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <FileAudio className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{arquivo.name}</p>
                  <p className="text-xs text-blue-700">
                    {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={limpar}
                disabled={processando}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {arquivo && !transcricao && (
            <Button 
              onClick={processarAudio}
              disabled={processando}
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {processando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Processar e Transcrever
                </>
              )}
            </Button>
          )}

          {progresso && (
            <div className={cn(
              "p-3 rounded-lg border",
              processando ? "bg-blue-50 border-blue-200" : "bg-emerald-50 border-emerald-200"
            )}>
              <p className={cn(
                "text-sm font-medium",
                processando ? "text-blue-900" : "text-emerald-900"
              )}>
                {progresso}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {transcricao && (
        <Card className="border-2 border-emerald-500">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <CheckCircle className="w-5 h-5" />
              Transcrição em Português (PT-BR)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="p-4 bg-white border rounded-lg max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {transcricao}
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={limpar} size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}