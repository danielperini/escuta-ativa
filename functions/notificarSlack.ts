import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mensagem, canal, titulo, prioridade } = await req.json();

    // Buscar integração Slack configurada
    const integracoes = await base44.asServiceRole.entities.IntegracaoExterna.filter({
      provedor: 'Slack',
      ativa: true
    });

    if (integracoes.length === 0) {
      return Response.json({ 
        error: 'Integração Slack não configurada' 
      }, { status: 400 });
    }

    const integracao = integracoes[0];
    const webhookUrl = integracao.configuracoes?.webhook_url;

    if (!webhookUrl) {
      return Response.json({ 
        error: 'Webhook URL não configurada' 
      }, { status: 400 });
    }

    // Determinar cor baseado na prioridade
    const cores = {
      urgente: '#E31E24',
      alta: '#FF6B35',
      media: '#F7B801',
      baixa: '#4A90E2'
    };

    // Enviar mensagem para Slack
    const payload = {
      username: 'Societa.ai',
      icon_emoji: ':bell:',
      attachments: [{
        color: cores[prioridade] || cores.media,
        title: titulo || 'Nova Notificação',
        text: mensagem,
        footer: 'Societa.ai - Inteligência Social',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem para Slack');
    }

    // Registrar log de integração
    await base44.asServiceRole.entities.IntegracaoExterna.update(integracao.id, {
      ultima_sincronizacao: new Date().toISOString(),
      logs_integracao: [
        ...(integracao.logs_integracao || []).slice(-20),
        {
          data: new Date().toISOString(),
          acao: 'notificacao_enviada',
          status: 'sucesso',
          mensagem: `Notificação enviada: ${titulo || mensagem.substring(0, 50)}`
        }
      ]
    });

    return Response.json({ 
      success: true,
      mensagem: 'Notificação enviada para Slack'
    });

  } catch (error) {
    console.error('Erro ao notificar Slack:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});