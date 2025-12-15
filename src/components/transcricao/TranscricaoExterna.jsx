import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Mic, 
  Video, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileAudio,
  Settings,
  Globe,
  Users,
  Sparkles,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/**
 * Componente para transcrição usando serviços externos (AssemblyAI, Google)
 * Envia arquivo, aguarda processamento e retorna texto transcrito
 */
export default function TranscricaoExterna({ onTranscricaoCompleta, onTranscricaoTempoReal }) {
  const [arquivo, setArquivo] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapa, setEtapa] = useState('');
  const [transcricao, setTranscricao] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [erro, setErro] = useState(null);
  
  // Configurações
  const [servico, setServico] = useState('assemblyai');
  const [idioma, setIdioma] = useState('pt');
  const [identificarFalantes, setIdentificarFalantes] = useState(false);
  const [analiseSentimento, setAnaliseSentimento] = useState(false);
  const [urlArquivo, setUrlArquivo] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo - aceitar qualquer áudio/vídeo ou extensões conhecidas
    const extensaoValida = /\.(mp3|wav|m4a|mp4|mov|avi|webm|ogg|flac|opus|mpeg|aac|wma)$/i.test(file.name);
    const tipoValido = file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type.includes('ogg');

    if (!tipoValido && !extensaoValida) {
      toast.error('Tipo de arquivo não suportado. Use áudio ou vídeo.');
      return;
    }

    // Validar tamanho (máximo 500MB para segurança)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 500MB');
      return;
    }

    setArquivo(file);
    setErro(null);
    setTranscricao('');
    setMetadata(null);
  };

  const iniciarTranscricao = async () => {
    if (!arquivo) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setProcessando(true);
    setProgresso(10);
    setErro(null);
    setEtapa('Enviando arquivo...');

    try {
      // 1. Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      setProgresso(30);
      setEtapa('Arquivo enviado. Iniciando transcrição...');

      if (onTranscricaoTempoReal) {
        onTranscricaoTempoReal('⏳ Processando transcrição externa...');
      }

      // 2. Chamar função de transcrição externa
      const opcoes = {
        speaker_labels: identificarFalantes,
        sentiment_analysis: analiseSentimento && servico === 'assemblyai',
        punctuate: true,
        format_text: true
      };

      setProgresso(50);
      setEtapa(`Transcrevendo com ${servico === 'assemblyai' ? 'AssemblyAI' : 'Google Speech'}...`);

      const response = await base44.functions.invoke('transcricaoExterna', {
        file_url: servico === 'tldv' ? urlArquivo : file_url,
        servico,
        idioma,
        opcoes
      });

      // Verificar se há erro na response
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (!response.data?.sucesso) {
        throw new Error(response.data?.error || 'Erro desconhecido na transcrição');
      }

      setProgresso(100);
      setEtapa('Transcrição concluída!');
      setTranscricao(response.data.transcricao);
      setMetadata(response.data.metadata);

      // Notificar componente pai
      if (onTranscricaoCompleta) {
        onTranscricaoCompleta(response.data.transcricao, file_url, response.data.metadata);
      }

      if (onTranscricaoTempoReal) {
        onTranscricaoTempoReal(response.data.transcricao);
      }

      toast.success('Transcrição concluída com sucesso!');

    } catch (error) {
      console.error('Erro na transcrição:', error);
      const mensagemErro = error.response?.data?.error || error.message || 'Erro ao processar transcrição';
      setErro(mensagemErro);
      setProgresso(0);
      setEtapa('');
      
      if (mensagemErro.includes('não configurada')) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-semibold">API Key não configurada</p>
            <button
              onClick={() => window.location.href = createPageUrl('ConfiguracaoTranscricao')}
              className="text-xs underline text-left"
            >
              Clique aqui para configurar
            </button>
          </div>,
          {
            duration: 7000
          }
        );
      } else if (mensagemErro.includes('400')) {
        toast.error('Erro de validação. Verifique o formato do arquivo e tente novamente.');
      } else {
        toast.error('Erro: ' + mensagemErro);
      }
    } finally {
      setProcessando(false);
    }
  };

  const limpar = () => {
    setArquivo(null);
    setTranscricao('');
    setMetadata(null);
    setErro(null);
    setProgresso(0);
    setEtapa('');
  };

  const formatarDuracao = (segundos) => {
    if (!segundos) return '--';
    const mins = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${mins}:${segs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Transcrição Externa (API)
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {servico === 'assemblyai' ? 'AssemblyAI' : 'Google Speech'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
          <div>
            <Label className="text-xs font-medium mb-2">Serviço de Transcrição</Label>
            <Select value={servico} onValueChange={setServico} disabled={processando || !!transcricao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assemblyai">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    AssemblyAI (Recomendado)
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    OpenAI Whisper
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    Google Speech-to-Text
                  </div>
                </SelectItem>
                <SelectItem value="tldv">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    tldv.io (Reuniões/URLs)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2">Idioma</Label>
            <Select value={idioma} onValueChange={setIdioma} disabled={processando || !!transcricao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">🇧🇷 Português (Brasil)</SelectItem>
                <SelectItem value="en">🇺🇸 Inglês</SelectItem>
                <SelectItem value="es">🇪🇸 Espanhol</SelectItem>
                <SelectItem value="fr">🇫🇷 Francês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Identificar Falantes</Label>
            <Switch 
              checked={identificarFalantes} 
              onCheckedChange={setIdentificarFalantes}
              disabled={processando || !!transcricao}
            />
          </div>

          {servico === 'assemblyai' && (
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Análise de Sentimento</Label>
              <Switch 
                checked={analiseSentimento} 
                onCheckedChange={setAnaliseSentimento}
                disabled={processando || !!transcricao}
              />
            </div>
          )}
        </div>

        {/* URL para tldv.io */}
        {servico === 'tldv' && !transcricao && (
          <div className="border-2 border-purple-300 rounded-lg p-4">
            <Label className="text-sm font-medium mb-2 block">URL da Gravação/Reunião</Label>
            <Input
              type="url"
              placeholder="https://exemplo.com/gravacao.mp4"
              value={urlArquivo}
              onChange={(e) => setUrlArquivo(e.target.value)}
              className="mb-3"
            />
            <p className="text-xs text-slate-500 mb-3">
              Cole a URL pública da gravação. Formatos suportados: MP3, MP4, WAV, M4A, MKV, MOV, AVI, WMA, FLAC
            </p>
            <Button
              onClick={iniciarTranscricao}
              disabled={processando || !urlArquivo}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Importar e Transcrever
            </Button>
          </div>
        )}

        {/* Upload de Arquivo */}
        {servico !== 'tldv' && !arquivo && !transcricao && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileAudio className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Selecione áudio ou vídeo
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {servico === 'tldv' ? 'Cole a URL da gravação ou reunião abaixo' : 'MP3, WAV, M4A, OGG, OPUS, MP4, MOV, WEBM (até 500MB)'}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Arquivo Selecionado */}
        {arquivo && !transcricao && (
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              {arquivo.type.startsWith('audio/') ? (
                <Mic className="w-6 h-6 text-blue-600" />
              ) : (
                <Video className="w-6 h-6 text-purple-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {arquivo.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {processando ? (
              <div className="space-y-3">
                <Progress value={progresso} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {etapa}
                </div>
                <p className="text-xs text-center text-slate-500">
                  ⏱️ Isso pode levar alguns minutos dependendo do tamanho do arquivo
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={iniciarTranscricao}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Iniciar Transcrição
                </Button>
                <Button
                  variant="outline"
                  onClick={limpar}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Erro na Transcrição</p>
                <p className="text-xs text-red-700 mt-1">{erro}</p>
                {erro.includes('não configurada') && (
                  <Button
                    variant="link"
                    className="text-xs text-red-600 p-0 h-auto mt-2"
                    onClick={() => window.location.href = '/Configuracoes'}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Ir para Configurações
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resultado da Transcrição */}
        {transcricao && (
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">
                    Transcrição Concluída
                  </h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limpar}
                >
                  Nova Transcrição
                </Button>
              </div>

              {metadata && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {metadata.duracao_audio && (
                    <div className="bg-white p-2 rounded border">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        Duração
                      </div>
                      <p className="text-sm font-semibold">
                        {formatarDuracao(metadata.duracao_audio)}
                      </p>
                    </div>
                  )}
                  {metadata.palavras_count && (
                    <div className="bg-white p-2 rounded border">
                      <div className="text-xs text-slate-500">Palavras</div>
                      <p className="text-sm font-semibold">
                        {metadata.palavras_count}
                      </p>
                    </div>
                  )}
                  {metadata.confianca && (
                    <div className="bg-white p-2 rounded border">
                      <div className="text-xs text-slate-500">Confiança</div>
                      <p className="text-sm font-semibold">
                        {(metadata.confianca * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-slate-500">Serviço</div>
                    <p className="text-xs font-semibold truncate">
                      {metadata.servico}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {transcricao}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dica de Configuração */}
        {!arquivo && !transcricao && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Configure suas API Keys
                </p>
                <p className="text-xs text-blue-800 mb-3">
                  Para usar a transcrição externa, você precisa configurar as chaves de API dos serviços:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 mb-3 ml-4">
                  <li>• <strong>AssemblyAI</strong> - Melhor qualidade, múltiplos idiomas</li>
                  <li>• <strong>OpenAI Whisper</strong> - Excelente precisão, 99+ idiomas</li>
                  <li>• <strong>Google Speech-to-Text</strong> - Alternativa confiável</li>
                  <li>• <strong>tldv.io</strong> - Importa reuniões de URLs públicas</li>
                </ul>
                <Button
                  onClick={() => window.location.href = createPageUrl('ConfiguracaoTranscricao')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Ir para Configurações
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}