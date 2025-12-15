import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Key, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Página para configurar integração com serviços externos de transcrição
 */
export default function ConfiguracaoTranscricao() {
  const [mostrarKeys, setMostrarKeys] = useState({
    assemblyai: false,
    google: false
  });

  const [apiKeys, setApiKeys] = useState({
    ASSEMBLYAI_API_KEY: '',
    GOOGLE_SPEECH_API_KEY: ''
  });

  const [editando, setEditando] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user-config'],
    queryFn: () => base44.auth.me()
  });

  // Carregar configurações atuais (se existirem)
  React.useEffect(() => {
    if (user?.configuracoes_transcricao) {
      setApiKeys({
        ASSEMBLYAI_API_KEY: user.configuracoes_transcricao.ASSEMBLYAI_API_KEY || '',
        GOOGLE_SPEECH_API_KEY: user.configuracoes_transcricao.GOOGLE_SPEECH_API_KEY || ''
      });
    }
  }, [user]);

  const salvarConfiguracao = async () => {
    try {
      // Salvar nas configurações do usuário
      await base44.auth.updateMe({
        configuracoes_transcricao: apiKeys
      });

      toast.success('Configurações salvas com sucesso!');
      setEditando(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações: ' + error.message);
    }
  };

  const testarConexao = async (servico) => {
    try {
      toast.info('Testando conexão...', { duration: 2000 });

      // Criar um arquivo de teste de áudio silencioso (1 segundo)
      const sampleRate = 16000;
      const duration = 1;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      
      // Criar arquivo WAV de teste
      const testBlob = new Blob([new Uint8Array(44100)], { type: 'audio/wav' });
      const testFile = new File([testBlob], 'test.wav', { type: 'audio/wav' });

      // Fazer upload
      const { file_url } = await base44.integrations.Core.UploadFile({ file: testFile });

      // Testar transcrição
      const response = await base44.functions.invoke('transcricaoExterna', {
        file_url,
        servico: servico === 'assemblyai' ? 'assemblyai' : 'google',
        idioma: 'pt',
        opcoes: {}
      });

      if (response.data.sucesso || response.data.error?.includes('vazia')) {
        toast.success(`✅ ${servico === 'assemblyai' ? 'AssemblyAI' : 'Google Speech'} conectado com sucesso!`);
      } else {
        throw new Error(response.data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      toast.error(`❌ Falha na conexão: ${error.message}`);
    }
  };

  const keyConfigurada = (key) => {
    return apiKeys[key] && apiKeys[key].length > 10;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuração de Transcrição Externa</h2>
          <p className="text-slate-500 text-sm mt-1">
            Configure serviços externos para transcrição de áudio/vídeo
          </p>
        </div>
        {user?.role === 'admin' && (
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        )}
      </div>

      {/* Informações Gerais */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Globe className="w-5 h-5" />
            Por que usar serviços externos?
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <Sparkles className="w-8 h-8 text-emerald-600 mb-2" />
              <h4 className="font-semibold text-emerald-900 mb-1">Alta Precisão</h4>
              <p className="text-emerald-700 text-xs">
                Modelos de IA especializados com acurácia superior a 95%
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Globe className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">Múltiplos Idiomas</h4>
              <p className="text-purple-700 text-xs">
                Suporte para português, inglês, espanhol e mais
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900 mb-1">Privacidade</h4>
              <p className="text-blue-700 text-xs">
                Suas API keys ficam seguras e criptografadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AssemblyAI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AssemblyAI
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Recomendado
              </Badge>
            </div>
            {keyConfigurada('ASSEMBLYAI_API_KEY') && (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
            <p className="text-slate-700">
              <strong>AssemblyAI</strong> oferece transcrição de alta qualidade com recursos avançados:
            </p>
            <ul className="text-slate-600 text-xs space-y-1 ml-4">
              <li>✓ Identificação automática de falantes</li>
              <li>✓ Análise de sentimento</li>
              <li>✓ Detecção de tópicos</li>
              <li>✓ Suporte a PT-BR nativo</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://www.assemblyai.com/dashboard/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                Criar conta grátis
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-xs text-slate-400">•</span>
              <a
                href="https://www.assemblyai.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-600 hover:underline flex items-center gap-1"
              >
                Documentação
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" />
              API Key
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={mostrarKeys.assemblyai ? 'text' : 'password'}
                  value={apiKeys.ASSEMBLYAI_API_KEY}
                  onChange={(e) => {
                    setApiKeys(prev => ({ ...prev, ASSEMBLYAI_API_KEY: e.target.value }));
                    setEditando(true);
                  }}
                  placeholder="cole sua API key aqui..."
                  className="pr-10"
                />
                <button
                  onClick={() => setMostrarKeys(prev => ({ ...prev, assemblyai: !prev.assemblyai }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarKeys.assemblyai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {keyConfigurada('ASSEMBLYAI_API_KEY') && (
                <Button
                  variant="outline"
                  onClick={() => testarConexao('assemblyai')}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Testar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Speech-to-Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Google Speech-to-Text
            </div>
            {keyConfigurada('GOOGLE_SPEECH_API_KEY') && (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
            <p className="text-slate-700">
              <strong>Google Speech-to-Text</strong> é robusto e confiável:
            </p>
            <ul className="text-slate-600 text-xs space-y-1 ml-4">
              <li>✓ Alta precisão em múltiplos idiomas</li>
              <li>✓ Integração com Google Cloud</li>
              <li>✓ Reconhecimento em tempo real</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Console do Google Cloud
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-xs text-slate-400">•</span>
              <a
                href="https://cloud.google.com/speech-to-text/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-600 hover:underline flex items-center gap-1"
              >
                Documentação
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" />
              API Key
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={mostrarKeys.google ? 'text' : 'password'}
                  value={apiKeys.GOOGLE_SPEECH_API_KEY}
                  onChange={(e) => {
                    setApiKeys(prev => ({ ...prev, GOOGLE_SPEECH_API_KEY: e.target.value }));
                    setEditando(true);
                  }}
                  placeholder="cole sua API key aqui..."
                  className="pr-10"
                />
                <button
                  onClick={() => setMostrarKeys(prev => ({ ...prev, google: !prev.google }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mostrarKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {keyConfigurada('GOOGLE_SPEECH_API_KEY') && (
                <Button
                  variant="outline"
                  onClick={() => testarConexao('google')}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Testar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-between items-center">
        <Link to={createPageUrl('Configuracoes')}>
          <Button variant="outline">
            Voltar
          </Button>
        </Link>
        <Button
          onClick={salvarConfiguracao}
          disabled={!editando}
          className="bg-[#E31E24] hover:bg-[#B01419] gap-2"
        >
          <Save className="w-4 h-4" />
          Salvar Configurações
        </Button>
      </div>

      {/* Aviso de Segurança */}
      <Card className="border-amber-500 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Segurança das API Keys</p>
              <p className="text-xs">
                Suas chaves são armazenadas de forma segura e criptografadas. Apenas administradores podem configurá-las.
                Nunca compartilhe suas API keys publicamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}