import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar integração HubSpot
    const integracoes = await base44.asServiceRole.entities.IntegracaoExterna.filter({
      provedor: 'HubSpot',
      ativa: true
    });

    if (integracoes.length === 0) {
      return Response.json({ 
        error: 'Integração HubSpot não configurada' 
      }, { status: 400 });
    }

    const integracao = integracoes[0];
    const apiKey = integracao.configuracoes?.api_key;

    if (!apiKey) {
      return Response.json({ 
        error: 'API Key não configurada' 
      }, { status: 400 });
    }

    // Buscar stakeholders para sincronizar
    const stakeholders = await base44.asServiceRole.entities.LiderancaComunitaria.list();
    let sincronizados = 0;
    let erros = 0;

    for (const stakeholder of stakeholders) {
      try {
        // Criar/atualizar contato no HubSpot
        const contactData = {
          properties: {
            email: stakeholder.email || `${stakeholder.nome.replace(/\s+/g, '_')}@societa.temp`,
            firstname: stakeholder.nome.split(' ')[0],
            lastname: stakeholder.nome.split(' ').slice(1).join(' ') || stakeholder.nome.split(' ')[0],
            phone: stakeholder.telefone || stakeholder.whatsapp || '',
            company: stakeholder.comunidade || '',
            jobtitle: stakeholder.papel_na_comunidade || 'Liderança Comunitária',
            hs_lead_status: stakeholder.avaliacao_interlocucao === 'boa' ? 'OPEN' : 'NEW'
          }
        };

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(contactData)
        });

        if (response.ok) {
          sincronizados++;
        } else {
          erros++;
        }
      } catch (error) {
        erros++;
        console.error(`Erro ao sincronizar ${stakeholder.nome}:`, error);
      }
    }

    // Registrar log de sincronização
    await base44.asServiceRole.entities.IntegracaoExterna.update(integracao.id, {
      ultima_sincronizacao: new Date().toISOString(),
      logs_integracao: [
        ...(integracao.logs_integracao || []).slice(-20),
        {
          data: new Date().toISOString(),
          acao: 'sincronizacao_hubspot',
          status: erros === 0 ? 'sucesso' : 'parcial',
          mensagem: `Sincronizados: ${sincronizados}, Erros: ${erros}`
        }
      ]
    });

    return Response.json({ 
      success: true,
      sincronizados,
      erros,
      total: stakeholders.length
    });

  } catch (error) {
    console.error('Erro ao sincronizar HubSpot:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});