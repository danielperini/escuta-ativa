import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, AlertTriangle, Calendar, CheckCircle, Users, Target, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";

const EVENTOS_DISPONIVEIS = [
  {
    id: 'demanda_urgente',
    nome: 'Nova Demanda Urgente',
    descricao: 'Quando uma demanda de alta ou crítica urgência é criada',
    icon: AlertTriangle,
    categoria: 'demandas',
    cor: 'text-red-600'
  },
  {
    id: 'demanda_atrasada',
    nome: 'Devolutiva Atrasada',
    descricao: 'Quando uma devolutiva passa do prazo sem conclusão',
    icon: Clock,
    categoria: 'demandas',
    cor: 'text-amber-600'
  },
  {
    id: 'compromisso_proximo',
    nome: 'Compromisso se Aproximando',
    descricao: 'Lembrete 3 dias antes do prazo de um compromisso',
    icon: CheckCircle,
    categoria: 'compromissos',
    cor: 'text-blue-600'
  },
  {
    id: 'compromisso_atrasado',
    nome: 'Compromisso Atrasado',
    descricao: 'Quando um compromisso passa do prazo sem conclusão',
    icon: AlertTriangle,
    categoria: 'compromissos',
    cor: 'text-red-600'
  },
  {
    id: 'agenda_amanha',
    nome: 'Agenda para Amanhã',
    descricao: 'Lembrete de agendas confirmadas para o próximo dia',
    icon: Calendar,
    categoria: 'agenda',
    cor: 'text-purple-600'
  },
  {
    id: 'agenda_atrasada',
    nome: 'Agenda Não Realizada',
    descricao: 'Quando uma agenda passa da data sem registro de realização',
    icon: AlertTriangle,
    categoria: 'agenda',
    cor: 'text-orange-600'
  },
  {
    id: 'risco_novo',
    nome: 'Novo Risco Detectado',
    descricao: 'Quando um novo risco social é identificado',
    icon: Target,
    categoria: 'riscos',
    cor: 'text-red-600'
  },
  {
    id: 'risco_critico',
    nome: 'Risco Crítico',
    descricao: 'Quando um risco atinge nível crítico',
    icon: AlertTriangle,
    categoria: 'riscos',
    cor: 'text-red-600'
  },
  {
    id: 'ator_atualizado',
    nome: 'Atualização de Stakeholder',
    descricao: 'Quando dados de um stakeholder são atualizados',
    icon: Users,
    categoria: 'stakeholders',
    cor: 'text-emerald-600'
  },
  {
    id: 'novo_registro',
    nome: 'Novo Registro Criado',
    descricao: 'Quando um novo registro é adicionado ao sistema',
    icon: FileText,
    categoria: 'registros',
    cor: 'text-blue-600'
  }
];

export default function PreferenciasNotificacoes() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['currentUser-notificacoes'],
    queryFn: () => base44.auth.me()
  });

  const [preferencias, setPreferencias] = useState({
    notificacoes_ativas: true,
    email_ativo: false,
    eventos_habilitados: [],
    frequencia_email: 'imediato' // imediato, diario, semanal
  });

  useEffect(() => {
    if (user?.configuracoes_notificacoes) {
      setPreferencias({
        notificacoes_ativas: user.configuracoes_notificacoes.notificacoes_ativas !== false,
        email_ativo: user.configuracoes_notificacoes.email_ativo || false,
        eventos_habilitados: user.configuracoes_notificacoes.eventos_habilitados || [],
        frequencia_email: user.configuracoes_notificacoes.frequencia_email || 'imediato'
      });
    }
  }, [user]);

  const handleSalvar = async () => {
    try {
      await base44.auth.updateMe({
        configuracoes_notificacoes: preferencias
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser-notificacoes'] });
      toast.success('Preferências de notificações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar preferências');
    }
  };

  const toggleEvento = (eventoId) => {
    setPreferencias(prev => ({
      ...prev,
      eventos_habilitados: prev.eventos_habilitados.includes(eventoId)
        ? prev.eventos_habilitados.filter(id => id !== eventoId)
        : [...prev.eventos_habilitados, eventoId]
    }));
  };

  const habilitarTodos = () => {
    setPreferencias(prev => ({
      ...prev,
      eventos_habilitados: EVENTOS_DISPONIVEIS.map(e => e.id)
    }));
  };

  const desabilitarTodos = () => {
    setPreferencias(prev => ({
      ...prev,
      eventos_habilitados: []
    }));
  };

  const eventosPorCategoria = EVENTOS_DISPONIVEIS.reduce((acc, evento) => {
    if (!acc[evento.categoria]) acc[evento.categoria] = [];
    acc[evento.categoria].push(evento);
    return acc;
  }, {});

  const categoriasNomes = {
    demandas: 'Demandas',
    compromissos: 'Compromissos',
    agenda: 'Agendas',
    riscos: 'Riscos Sociais',
    stakeholders: 'Stakeholders',
    registros: 'Registros'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferências de Notificações
          </div>
          <Button onClick={handleSalvar} className="bg-[#E31E24] hover:bg-[#B01419]">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativar/Desativar Notificações */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium text-slate-900">Notificações no Sistema</p>
            <p className="text-sm text-slate-500">Receber notificações dentro da plataforma</p>
          </div>
          <Switch
            checked={preferencias.notificacoes_ativas}
            onCheckedChange={(checked) => setPreferencias(prev => ({ ...prev, notificacoes_ativas: checked }))}
          />
        </div>

        {/* Email */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-slate-900">Notificações por Email</p>
              <p className="text-sm text-slate-500">Receber alertas no email {user?.email}</p>
            </div>
          </div>
          <Switch
            checked={preferencias.email_ativo}
            onCheckedChange={(checked) => setPreferencias(prev => ({ ...prev, email_ativo: checked }))}
          />
        </div>

        {preferencias.email_ativo && (
          <div className="pl-4 space-y-2">
            <Label>Frequência de Emails</Label>
            <div className="grid grid-cols-3 gap-2">
              {['imediato', 'diario', 'semanal'].map(freq => (
                <button
                  key={freq}
                  onClick={() => setPreferencias(prev => ({ ...prev, frequencia_email: freq }))}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    preferencias.frequencia_email === freq
                      ? 'border-[#E31E24] bg-red-50 text-[#E31E24]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {freq === 'imediato' && 'Imediato'}
                  {freq === 'diario' && 'Resumo Diário'}
                  {freq === 'semanal' && 'Resumo Semanal'}
                </button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Controles Rápidos */}
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-900">Eventos que Geram Notificações</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={habilitarTodos}>
              Habilitar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={desabilitarTodos}>
              Desabilitar Todos
            </Button>
          </div>
        </div>

        {/* Lista de Eventos por Categoria */}
        <div className="space-y-6">
          {Object.entries(eventosPorCategoria).map(([categoria, eventos]) => (
            <div key={categoria}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-sm">{categoriasNomes[categoria]}</Badge>
                <span className="text-xs text-slate-500">
                  {eventos.filter(e => preferencias.eventos_habilitados.includes(e.id)).length} de {eventos.length} ativos
                </span>
              </div>
              <div className="space-y-2">
                {eventos.map(evento => {
                  const Icon = evento.icon;
                  const habilitado = preferencias.eventos_habilitados.includes(evento.id);

                  return (
                    <div
                      key={evento.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        habilitado
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                      onClick={() => toggleEvento(evento.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full ${habilitado ? 'bg-emerald-100' : 'bg-slate-100'} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${habilitado ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${habilitado ? 'text-slate-900' : 'text-slate-600'}`}>
                            {evento.nome}
                          </p>
                          <p className="text-xs text-slate-500">{evento.descricao}</p>
                        </div>
                      </div>
                      <Switch
                        checked={habilitado}
                        onCheckedChange={() => toggleEvento(evento.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Dica:</strong> Você receberá notificações apenas para os eventos selecionados.
            As notificações por email respeitam a frequência configurada.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}