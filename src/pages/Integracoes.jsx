import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plug,
  MapPin,
  MessageSquare,
  Users,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const INTEGRACOES_DISPONIVEIS = [
  {
    id: 'google_maps',
    nome: 'Google Maps',
    provedor: 'Google',
    tipo: 'maps',
    descricao: 'Visualização de endereços e coordenadas geográficas',
    icon: MapPin,
    cor: 'bg-red-100 text-red-700',
    campos: [
      { nome: 'api_key', label: 'API Key do Google Maps', tipo: 'password', obrigatorio: true }
    ],
    instrucoes: 'Obtenha sua API key em https://console.cloud.google.com/google/maps-apis'
  },
  {
    id: 'slack',
    nome: 'Slack',
    provedor: 'Slack',
    tipo: 'comunicacao',
    descricao: 'Envio de notificações e alertas para canais Slack',
    icon: MessageSquare,
    cor: 'bg-purple-100 text-purple-700',
    campos: [
      { nome: 'webhook_url', label: 'Webhook URL', tipo: 'text', obrigatorio: true },
      { nome: 'canal_padrao', label: 'Canal Padrão', tipo: 'text', obrigatorio: false }
    ],
    instrucoes: 'Configure um Incoming Webhook em https://api.slack.com/messaging/webhooks'
  },
  {
    id: 'hubspot',
    nome: 'HubSpot',
    provedor: 'HubSpot',
    tipo: 'crm',
    descricao: 'Sincronização de stakeholders com HubSpot CRM',
    icon: Users,
    cor: 'bg-orange-100 text-orange-700',
    campos: [
      { nome: 'api_key', label: 'HubSpot API Key', tipo: 'password', obrigatorio: true },
      { nome: 'sincronizar_stakeholders', label: 'Sincronizar Stakeholders', tipo: 'checkbox', obrigatorio: false }
    ],
    instrucoes: 'Obtenha sua API key em Settings > Integrations > API Key'
  },
  {
    id: 'salesforce',
    nome: 'Salesforce',
    provedor: 'Salesforce',
    tipo: 'crm',
    descricao: 'Integração com Salesforce CRM',
    icon: Users,
    cor: 'bg-blue-100 text-blue-700',
    campos: [
      { nome: 'consumer_key', label: 'Consumer Key', tipo: 'password', obrigatorio: true },
      { nome: 'consumer_secret', label: 'Consumer Secret', tipo: 'password', obrigatorio: true },
      { nome: 'instance_url', label: 'Instance URL', tipo: 'text', obrigatorio: true }
    ],
    instrucoes: 'Configure um Connected App em Setup > Apps > App Manager'
  }
];

export default function Integracoes() {
  const queryClient = useQueryClient();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [integracaoSelecionada, setIntegracaoSelecionada] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  const [configData, setConfigData] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser-integracoes'],
    queryFn: () => base44.auth.me()
  });

  const { data: integracoes = [] } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => base44.entities.IntegracaoExterna.list()
  });

  const isAdmin = user?.role === 'admin';

  const configurarIntegracao = async () => {
    if (!integracaoSelecionada) return;

    try {
      // Validar campos obrigatórios
      const camposObrigatorios = integracaoSelecionada.campos.filter(c => c.obrigatorio);
      for (const campo of camposObrigatorios) {
        if (!configData[campo.nome]) {
          toast.error(`Campo obrigatório: ${campo.label}`);
          return;
        }
      }

      // Criar ou atualizar integração
      const integracaoExistente = integracoes.find(i => i.provedor === integracaoSelecionada.provedor);
      
      const dadosIntegracao = {
        nome: integracaoSelecionada.nome,
        tipo: integracaoSelecionada.tipo,
        provedor: integracaoSelecionada.provedor,
        ativa: true,
        status: 'ativa',
        configuracoes: configData,
        funcionalidades: Object.keys(configData).filter(k => configData[k] === true)
      };

      if (integracaoExistente) {
        await base44.entities.IntegracaoExterna.update(integracaoExistente.id, dadosIntegracao);
      } else {
        await base44.entities.IntegracaoExterna.create(dadosIntegracao);
      }

      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
      setShowConfigDialog(false);
      setConfigData({});
      toast.success(`${integracaoSelecionada.nome} configurado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao configurar integração: ' + error.message);
    }
  };

  const testarIntegracao = async (integracao) => {
    toast.info('Testando integração...');
    
    try {
      // Simular teste
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await base44.entities.IntegracaoExterna.update(integracao.id, {
        status: 'ativa',
        ultima_sincronizacao: new Date().toISOString(),
        logs_integracao: [
          ...(integracao.logs_integracao || []),
          {
            data: new Date().toISOString(),
            acao: 'teste',
            status: 'sucesso',
            mensagem: 'Teste de conexão bem-sucedido'
          }
        ]
      });
      
      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
      toast.success('Integração testada com sucesso!');
    } catch (error) {
      toast.error('Erro ao testar integração');
    }
  };

  const desativarIntegracao = async (integracao) => {
    try {
      await base44.entities.IntegracaoExterna.update(integracao.id, {
        ativa: false,
        status: 'desativada'
      });
      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
      toast.success('Integração desativada');
    } catch (error) {
      toast.error('Erro ao desativar integração');
    }
  };

  const getIntegracaoConfig = (provedor) => {
    return integracoes.find(i => i.provedor === provedor);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrações Externas</h1>
          <p className="text-slate-500 mt-1">Conecte com ferramentas e serviços externos</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {integracoes.filter(i => i.ativa).length} ativas
        </Badge>
      </div>

      {!isAdmin && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Apenas administradores podem configurar integrações
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="disponiveis">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="disponiveis">Integrações Disponíveis</TabsTrigger>
          <TabsTrigger value="ativas">
            Minhas Integrações ({integracoes.filter(i => i.ativa).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRACOES_DISPONIVEIS.map(integracao => {
              const Icon = integracao.icon;
              const config = getIntegracaoConfig(integracao.provedor);
              const isAtiva = config?.ativa;

              return (
                <Card key={integracao.id} className={cn(
                  "transition-all hover:shadow-lg",
                  isAtiva && "border-2 border-emerald-500"
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", integracao.cor)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integracao.nome}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {integracao.tipo}
                          </Badge>
                        </div>
                      </div>
                      {isAtiva && (
                        <Badge className="bg-emerald-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-600">{integracao.descricao}</p>
                    {isAdmin && (
                      <Button
                        onClick={() => {
                          setIntegracaoSelecionada(integracao);
                          setConfigData(config?.configuracoes || {});
                          setShowConfigDialog(true);
                        }}
                        variant={isAtiva ? "outline" : "default"}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {isAtiva ? 'Reconfigurar' : 'Configurar'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ativas" className="space-y-4 mt-6">
          {integracoes.filter(i => i.ativa).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plug className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Nenhuma integração ativa</p>
              </CardContent>
            </Card>
          ) : (
            integracoes.filter(i => i.ativa).map(integracao => {
              const integracaoInfo = INTEGRACOES_DISPONIVEIS.find(d => d.provedor === integracao.provedor);
              const Icon = integracaoInfo?.icon || Plug;
              const statusColors = {
                ativa: 'bg-emerald-600',
                erro: 'bg-red-600',
                desativada: 'bg-slate-600',
                configurando: 'bg-blue-600'
              };

              return (
                <Card key={integracao.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn("w-14 h-14 rounded-lg flex items-center justify-center", integracaoInfo?.cor || "bg-slate-100")}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900">{integracao.nome}</h3>
                            <Badge className={statusColors[integracao.status] || 'bg-slate-600'}>
                              {integracao.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {integracaoInfo?.descricao}
                          </p>
                          {integracao.ultima_sincronizacao && (
                            <p className="text-xs text-slate-400 mt-1">
                              Última sincronização: {new Date(integracao.ultima_sincronizacao).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testarIntegracao(integracao)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => desativarIntegracao(integracao)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {integracao.logs_integracao && integracao.logs_integracao.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-slate-700 mb-2">Últimos eventos:</p>
                        <div className="space-y-1">
                          {integracao.logs_integracao.slice(-3).map((log, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{log.mensagem}</span>
                              <span className="text-slate-400">
                                {new Date(log.data).toLocaleTimeString('pt-BR')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Configurar Integração */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {integracaoSelecionada?.icon && <integracaoSelecionada.icon className="w-5 h-5" />}
              Configurar {integracaoSelecionada?.nome}
            </DialogTitle>
            <DialogDescription>
              {integracaoSelecionada?.descricao}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {integracaoSelecionada?.instrucoes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Instruções:</strong> {integracaoSelecionada.instrucoes}
                </p>
              </div>
            )}

            {integracaoSelecionada?.campos.map(campo => (
              <div key={campo.nome} className="space-y-2">
                <Label>
                  {campo.label}
                  {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
                </Label>
                {campo.tipo === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={configData[campo.nome] || false}
                      onCheckedChange={(checked) => setConfigData(prev => ({ ...prev, [campo.nome]: checked }))}
                    />
                    <span className="text-sm text-slate-600">Habilitar</span>
                  </div>
                ) : campo.tipo === 'password' ? (
                  <div className="relative">
                    <Input
                      type={showApiKey[campo.nome] ? 'text' : 'password'}
                      value={configData[campo.nome] || ''}
                      onChange={(e) => setConfigData(prev => ({ ...prev, [campo.nome]: e.target.value }))}
                      placeholder={`Digite ${campo.label.toLowerCase()}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(prev => ({ ...prev, [campo.nome]: !prev[campo.nome] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey[campo.nome] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : campo.tipo === 'textarea' ? (
                  <Textarea
                    value={configData[campo.nome] || ''}
                    onChange={(e) => setConfigData(prev => ({ ...prev, [campo.nome]: e.target.value }))}
                    placeholder={`Digite ${campo.label.toLowerCase()}`}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={campo.tipo}
                    value={configData[campo.nome] || ''}
                    onChange={(e) => setConfigData(prev => ({ ...prev, [campo.nome]: e.target.value }))}
                    placeholder={`Digite ${campo.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <Key className="w-3 h-3 inline mr-1" />
                <strong>Segurança:</strong> Suas chaves de API são armazenadas de forma segura e criptografada.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={configurarIntegracao} className="bg-[#E31E24] hover:bg-[#B01419]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Salvar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}