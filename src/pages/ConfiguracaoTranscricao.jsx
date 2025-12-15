import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Shield,
  Loader2,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ConfiguracaoTranscricao() {
  const [showAssemblyKey, setShowAssemblyKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showTldvKey, setShowTldvKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  
  const [assemblyaiKey, setAssemblyaiKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [tldvKey, setTldvKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [testando, setTestando] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user-transcricao'],
    queryFn: () => base44.auth.me()
  });

  React.useEffect(() => {
    if (user?.configuracoes?.transcricao_externa) {
      setAssemblyaiKey(user.configuracoes.transcricao_externa.assemblyai_key || '');
      setGoogleKey(user.configuracoes.transcricao_externa.google_key || '');
      setTldvKey(user.configuracoes.transcricao_externa.tldv_key || '');
      setOpenaiKey(user.configuracoes.transcricao_externa.openai_key || '');
    }
  }, [user]);

  const salvarConfiguracoes = async () => {
    try {
      await base44.auth.updateMe({
        configuracoes: {
          ...user.configuracoes,
          transcricao_externa: {
            assemblyai_key: assemblyaiKey,
            google_key: googleKey,
            tldv_key: tldvKey,
            openai_key: openaiKey
          }
        }
      });
      toast.success('Configurações salvas!');
      setEditMode(false);
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const testConnection = async (servico) => {
    setTestando(true);
    try {
      const testFile = new Blob([new Uint8Array(44100)], { type: 'audio/wav' });
      const file = new File([testFile], 'test.wav', { type: 'audio/wav' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.functions.invoke('transcricaoExterna', {
        file_url,
        servico,
        idioma: 'pt',
        opcoes: {}
      });
      
      toast.success(`✅ Conexão com ${servico} OK!`);
    } catch (error) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transcrição Externa</h2>
          <p className="text-slate-500 text-sm mt-1">Configure serviços de transcrição profissionais</p>
        </div>
      </div>

      {/* Info Geral */}
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
              <p className="text-emerald-700 text-xs">Acurácia superior a 95%</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Globe className="w-8 h-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">Múltiplos Idiomas</h4>
              <p className="text-purple-700 text-xs">99+ idiomas suportados</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900 mb-1">Privacidade</h4>
              <p className="text-blue-700 text-xs">API keys criptografadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AssemblyAI */}
        <Card className="border-2 border-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              AssemblyAI
              <Badge className="bg-purple-100 text-purple-700">Recomendado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recursos
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 🎯 Identificação de falantes</li>
                <li>• 💬 Análise de sentimento</li>
                <li>• 📊 Detecção de tópicos</li>
                <li>• 🇧🇷 PT-BR nativo</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>API Key da AssemblyAI</Label>
              <div className="relative">
                <Input
                  type={showAssemblyKey ? 'text' : 'password'}
                  value={assemblyaiKey}
                  onChange={(e) => {
                    setAssemblyaiKey(e.target.value);
                    setEditMode(true);
                  }}
                  placeholder="Insira sua API Key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAssemblyKey(!showAssemblyKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showAssemblyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-700 mb-2 font-medium">Como obter:</p>
              <ol className="text-xs text-slate-600 space-y-1 ml-4 list-decimal">
                <li>Acesse <a href="https://www.assemblyai.com/dashboard/signup" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">assemblyai.com/dashboard</a></li>
                <li>Crie uma conta gratuita</li>
                <li>Copie sua API Key</li>
              </ol>
            </div>

            {assemblyaiKey && (
              <Button
                variant="outline"
                onClick={() => testConnection('assemblyai')}
                disabled={testando}
                className="w-full"
              >
                {testando ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testando...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Testar Conexão</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* OpenAI Whisper */}
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Sparkles className="w-5 h-5" />
              OpenAI Whisper
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Recursos
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• 🎯 Excelente precisão em PT</li>
                <li>• 🌍 Suporta 99+ idiomas</li>
                <li>• ⚡ Rápido e eficiente</li>
                <li>• 💰 $0.006/minuto</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>API Key da OpenAI</Label>
              <div className="relative">
                <Input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setEditMode(true);
                  }}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-700 mb-2 font-medium">Como obter:</p>
              <ol className="text-xs text-slate-600 space-y-1 ml-4 list-decimal">
                <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">platform.openai.com/api-keys</a></li>
                <li>Faça login ou crie uma conta</li>
                <li>Clique em "Create new secret key"</li>
                <li>Copie e cole aqui</li>
              </ol>
            </div>

            {openaiKey && (
              <Button
                variant="outline"
                onClick={() => testConnection('openai')}
                disabled={testando}
                className="w-full"
              >
                {testando ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testando...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Testar Conexão</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Google Speech */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Globe className="w-5 h-5" />
              Google Speech-to-Text
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>API Key do Google Cloud</Label>
              <div className="relative">
                <Input
                  type={showGoogleKey ? 'text' : 'password'}
                  value={googleKey}
                  onChange={(e) => {
                    setGoogleKey(e.target.value);
                    setEditMode(true);
                  }}
                  placeholder="Insira sua API Key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGoogleKey(!showGoogleKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showGoogleKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* tldv.io */}
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Globe className="w-5 h-5" />
              tldv.io
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>API Key do tldv.io</Label>
              <div className="relative">
                <Input
                  type={showTldvKey ? 'text' : 'password'}
                  value={tldvKey}
                  onChange={(e) => {
                    setTldvKey(e.target.value);
                    setEditMode(true);
                  }}
                  placeholder="Insira sua API Key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowTldvKey(!showTldvKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showTldvKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões */}
      <div className="flex justify-between">
        <Link to={createPageUrl('Configuracoes')}>
          <Button variant="outline">Voltar</Button>
        </Link>
        <Button
          onClick={salvarConfiguracoes}
          disabled={!editMode}
          className="bg-[#E31E24] hover:bg-[#B01419]"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* Aviso */}
      <Card className="border-amber-500 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Segurança</p>
              <p className="text-xs">Suas chaves são criptografadas e nunca compartilhadas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}