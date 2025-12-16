import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addDays, differenceInDays, isBefore } from 'date-fns';

export default function GeradorNotificacoesInteligente() {
  const { data: user } = useQuery({
    queryKey: ['currentUser-gerador'],
    queryFn: () => base44.auth.me()
  });

  const { data: registros = [] } = useQuery({
    queryKey: ['registros-notif'],
    queryFn: () => base44.entities.Registro.list('-created_date', 100)
  });

  const { data: agendas = [] } = useQuery({
    queryKey: ['agendas-notif'],
    queryFn: () => base44.entities.Agenda.list()
  });

  const { data: riscos = [] } = useQuery({
    queryKey: ['riscos-notif'],
    queryFn: () => base44.entities.RiscoSocial.list()
  });

  const { data: compromissos = [] } = useQuery({
    queryKey: ['compromissos-notif'],
    queryFn: () => base44.entities.Compromisso.list()
  });

  useEffect(() => {
    if (!user?.configuracoes_notificacoes?.notificacoes_ativas) return;

    const verificarNotificacoes = async () => {
      const eventosHabilitados = user.configuracoes_notificacoes.eventos_habilitados || [];
      const hoje = new Date();

      // Demandas Urgentes
      if (eventosHabilitados.includes('demanda_urgente')) {
        for (const registro of registros) {
          const demandasUrgentes = registro.demandas?.filter(
            d => ['alta', 'critica'].includes(d.urgencia) && d.status === 'pendente'
          ) || [];

          for (const demanda of demandasUrgentes) {
            const jaNotificada = await verificarSeJaNotificou(
              'demanda_urgente',
              `${registro.id}-${demanda.descricao}`
            );

            if (!jaNotificada) {
              await criarNotificacao({
                tipo: 'nova_demanda',
                titulo: `Demanda ${demanda.urgencia === 'critica' ? 'Crítica' : 'Urgente'}`,
                mensagem: `${demanda.descricao} (${registro.comunidade || 'Comunidade não especificada'})`,
                prioridade: demanda.urgencia === 'critica' ? 'urgente' : 'alta',
                entidade_relacionada_tipo: 'Registro',
                entidade_relacionada_id: registro.id
              });

              if (user.configuracoes_notificacoes.email_ativo) {
                await enviarEmailNotificacao(user.email, {
                  assunto: `[Societa.ai] Demanda ${demanda.urgencia === 'critica' ? 'Crítica' : 'Urgente'}`,
                  corpo: `Nova demanda de prioridade ${demanda.urgencia}:\n\n${demanda.descricao}\n\nComunidade: ${registro.comunidade || 'N/A'}`
                });
              }
            }
          }
        }
      }

      // Devolutivas Atrasadas
      if (eventosHabilitados.includes('demanda_atrasada')) {
        for (const registro of registros) {
          const demandasAtrasadas = registro.demandas?.filter(
            d => d.requer_devolutiva && 
                 !d.devolutiva_realizada && 
                 d.prazo_devolutiva &&
                 isBefore(new Date(d.prazo_devolutiva), hoje)
          ) || [];

          for (const demanda of demandasAtrasadas) {
            const diasAtraso = Math.abs(differenceInDays(new Date(demanda.prazo_devolutiva), hoje));
            const jaNotificada = await verificarSeJaNotificou(
              'demanda_atrasada',
              `${registro.id}-${demanda.descricao}-${diasAtraso}`
            );

            if (!jaNotificada) {
              await criarNotificacao({
                tipo: 'demanda_atrasada',
                titulo: 'Devolutiva Atrasada',
                mensagem: `Devolutiva pendente há ${diasAtraso} dias: ${demanda.descricao}`,
                prioridade: diasAtraso > 7 ? 'alta' : 'media',
                entidade_relacionada_tipo: 'Registro',
                entidade_relacionada_id: registro.id
              });
            }
          }
        }
      }

      // Agendas para Amanhã
      if (eventosHabilitados.includes('agenda_amanha')) {
        const amanha = addDays(hoje, 1);
        const agendasAmanha = agendas.filter(a => {
          const dataAgenda = new Date(a.data);
          return dataAgenda.toDateString() === amanha.toDateString() &&
                 ['confirmada', 'prevista'].includes(a.status);
        });

        for (const agenda of agendasAmanha) {
          const jaNotificada = await verificarSeJaNotificou(
            'agenda_amanha',
            agenda.id
          );

          if (!jaNotificada) {
            await criarNotificacao({
              tipo: 'nova_agenda',
              titulo: 'Agenda para Amanhã',
              mensagem: `${agenda.titulo} - ${agenda.comunidade || 'Local não especificado'}`,
              prioridade: 'media',
              entidade_relacionada_tipo: 'Agenda',
              entidade_relacionada_id: agenda.id
            });
          }
        }
      }

      // Riscos Críticos
      if (eventosHabilitados.includes('risco_critico')) {
        const riscosCriticos = riscos.filter(r => r.nivel === 'critico' && r.status === 'ativo');

        for (const risco of riscosCriticos) {
          const jaNotificada = await verificarSeJaNotificou(
            'risco_critico',
            risco.id
          );

          if (!jaNotificada) {
            await criarNotificacao({
              tipo: 'risco_critico',
              titulo: 'Risco Crítico Ativo',
              mensagem: `${risco.titulo} - ${risco.comunidade}`,
              prioridade: 'urgente',
              entidade_relacionada_tipo: 'RiscoSocial',
              entidade_relacionada_id: risco.id
            });

            if (user.configuracoes_notificacoes.email_ativo) {
              await enviarEmailNotificacao(user.email, {
                assunto: '[URGENTE] Risco Social Crítico Detectado',
                corpo: `Um risco crítico foi identificado:\n\n${risco.titulo}\nComunidade: ${risco.comunidade}\n\nAções recomendadas:\n${risco.acoes_preventivas?.join('\n- ') || 'Nenhuma ação sugerida'}`
              });
            }
          }
        }
      }

      // Compromissos se Aproximando
      if (eventosHabilitados.includes('compromisso_proximo')) {
        const em3Dias = addDays(hoje, 3);
        const compromissosProximos = compromissos.filter(c => {
          if (!c.prazo || c.status !== 'pendente') return false;
          const dataPrazo = new Date(c.prazo);
          return dataPrazo <= em3Dias && dataPrazo >= hoje;
        });

        for (const compromisso of compromissosProximos) {
          const jaNotificada = await verificarSeJaNotificou(
            'compromisso_proximo',
            compromisso.id
          );

          if (!jaNotificada) {
            await criarNotificacao({
              tipo: 'novo_compromisso',
              titulo: 'Compromisso se Aproximando',
              mensagem: `${compromisso.titulo} - Prazo em ${differenceInDays(new Date(compromisso.prazo), hoje)} dias`,
              prioridade: 'media',
              entidade_relacionada_tipo: 'Compromisso',
              entidade_relacionada_id: compromisso.id
            });
          }
        }
      }
    };

    verificarNotificacoes();
    const interval = setInterval(verificarNotificacoes, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [user, registros, agendas, riscos, compromissos]);

  return null;
}

// Funções auxiliares
async function verificarSeJaNotificou(tipo, identificador) {
  try {
    const notificacoes = await base44.entities.Notificacao.filter({ tipo });
    return notificacoes.some(n => 
      n.mensagem?.includes(identificador) && 
      new Date(n.created_date) > addDays(new Date(), -1)
    );
  } catch {
    return false;
  }
}

async function criarNotificacao(dados) {
  try {
    await base44.entities.Notificacao.create({
      ...dados,
      lida: false,
      status: 'pendente'
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

async function enviarEmailNotificacao(email, { assunto, corpo }) {
  try {
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: assunto,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/6ef53ae31_transparent-Photoroom12.png" 
                 alt="Societa.ai" style="height: 60px;" />
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #E31E24;">
            <pre style="font-family: Arial, sans-serif; white-space: pre-wrap; color: #333;">${corpo}</pre>
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="text-align: center; font-size: 12px; color: #999;">
            Societa.ai - Inteligência Social<br/>
            <a href="${window.location.origin}" style="color: #E31E24;">Acessar plataforma</a>
          </p>
        </div>
      `
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}