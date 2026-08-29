import { base44 } from '@/api/base44Client';

/**
 * Processamento IA em LOTE ÚNICO
 * Extrai TUDO em uma chamada: temas, atores, demandas, compromissos, riscos, localização, sentimento.
 *
 * Agora roteia à função backend `analisarNovoRegistro` (que usa a API GPT/OpenAI
 * diretamente, com a secreta OPENAI_API_KEY), em vez de InvokeLLM.
 */
export async function processarRegistroCompleto(textoConsolidado, comunidade) {
  try {
    const res = await base44.functions.invoke('analisarNovoRegistro', {
      textoConsolidado,
      comunidade: comunidade || ''
    });
    const data = res?.data ?? res;
    if (data && data.error && !data.identificacao) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error('Erro no processamento IA em lote:', error);
    throw error;
  }
}

/**
 * Alimenta TODOS os módulos após processamento
 */
export async function alimentarModulos(registroId, dadosProcessados) {
  const promises = [];

  // 1. MATERIALIDADE
  if (dadosProcessados.materialidade) {
    const temas = [...new Set([
      ...(dadosProcessados.materialidade.temas_comunidade || []),
      ...(dadosProcessados.materialidade.temas_empresa || [])
    ])];

    for (const tema of temas) {
      promises.push(
        criarOuAtualizarTema(tema, dadosProcessados)
      );
    }
  }

  // 2. COMPROMISSOS
  if (dadosProcessados.compromissos) {
    for (const comp of dadosProcessados.compromissos) {
      promises.push(
        base44.entities.Compromisso.create({
          titulo: comp.descricao,
          descricao: comp.descricao,
          registro_origem_id: registroId,
          comunidade: dadosProcessados.identificacao?.comunidade,
          responsavel: comp.responsavel || 'A definir',
          prazo: comp.prazo ? calcularData(comp.prazo) : null,
          prioridade: comp.prioridade || 'media',
          status: 'pendente'
        })
      );
    }
  }

  // 3. STAKEHOLDERS
  if (dadosProcessados.stakeholders) {
    for (const stakeholder of dadosProcessados.stakeholders) {
      promises.push(
        criarOuAtualizarStakeholder(stakeholder, registroId, dadosProcessados.identificacao?.comunidade)
      );
    }
  }

  // 4. RISCOS SOCIAIS
  if (dadosProcessados.riscos && dadosProcessados.riscos.length > 0) {
    for (const risco of dadosProcessados.riscos) {
      promises.push(
        base44.entities.RiscoSocial.create({
          titulo: risco.titulo,
          nivel: risco.nivel,
          tipo: risco.tipo || 'tensao_comunitaria',
          descricao: risco.causas?.join(', '),
          comunidade: dadosProcessados.identificacao?.comunidade,
          causas: risco.causas || [],
          acoes_preventivas: risco.acoes_preventivas || [],
          registros_associados: [registroId],
          status: 'ativo'
        })
      );
    }
  }

  // 5. AGENDA FUTURA
  if (dadosProcessados.agenda_futura && dadosProcessados.agenda_futura.length > 0) {
    for (const evento of dadosProcessados.agenda_futura) {
      promises.push(
        base44.entities.Agenda.create({
          titulo: evento.titulo,
          data: evento.data,
          tipo: evento.tipo || 'reuniao',
          comunidade: dadosProcessados.identificacao?.comunidade,
          registro_origem_id: registroId,
          status: 'prevista'
        })
      );
    }
  }

  await Promise.allSettled(promises);
}

async function criarOuAtualizarTema(nomeTema, dadosProcessados) {
  try {
    const temas = await base44.entities.Tema.list();
    const temaExistente = temas.find(t => 
      t.nome.toLowerCase() === nomeTema.toLowerCase()
    );

    const relevancia_comunidade = dadosProcessados.materialidade?.relevancia_comunidade || 5;
    const relevancia_empresa = dadosProcessados.materialidade?.relevancia_empresa || 5;

    if (temaExistente) {
      await base44.entities.Tema.update(temaExistente.id, {
        mencoes_total: (temaExistente.mencoes_total || 0) + 1,
        ultima_mencao: new Date().toISOString().split('T')[0],
        relevancia_comunidade,
        relevancia_empresa,
        divergencia: Math.abs(relevancia_comunidade - relevancia_empresa)
      });
    } else {
      await base44.entities.Tema.create({
        nome: nomeTema,
        categoria: 'outro',
        relevancia_comunidade,
        relevancia_empresa,
        divergencia: Math.abs(relevancia_comunidade - relevancia_empresa),
        mencoes_total: 1,
        ultima_mencao: new Date().toISOString().split('T')[0],
        tendencia: 'estavel',
        prioritario: relevancia_comunidade >= 8 || relevancia_empresa >= 8
      });
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar tema:', error);
  }
}

async function criarOuAtualizarStakeholder(stakeholderData, registroId, comunidade) {
  try {
    const stakeholders = await base44.entities.Stakeholder.list();
    
    // Fuzzy match (nome similar)
    const existente = stakeholders.find(s => {
      const nomeSimilar = s.nome.toLowerCase().includes(stakeholderData.nome.toLowerCase().split(' ')[0]) ||
                         stakeholderData.nome.toLowerCase().includes(s.nome.toLowerCase().split(' ')[0]);
      const mesmaComunidade = s.comunidade === comunidade;
      return nomeSimilar && mesmaComunidade;
    });

    if (existente) {
      // EVOLUÇÃO INCREMENTAL - adicionar novas informações
      const updates = {
        registros_vinculados: [...new Set([...(existente.registros_vinculados || []), registroId])],
        historico_interacoes: (existente.historico_interacoes || 0) + 1,
        ultima_interacao: new Date().toISOString().split('T')[0],
        historico_evolucao: [
          ...(existente.historico_evolucao || []),
          {
            data: new Date().toISOString(),
            campo_atualizado: 'nova_interacao',
            valor_novo: 'Mencionado em novo registro',
            registro_fonte: registroId
          }
        ]
      };

      // Adicionar novos dados sem sobrescrever
      if (stakeholderData.contato_telefone && !existente.contato?.telefone) {
        updates.contato = { ...existente.contato, telefone: stakeholderData.contato_telefone };
        updates.historico_evolucao.push({
          data: new Date().toISOString(),
          campo_atualizado: 'telefone',
          valor_novo: stakeholderData.contato_telefone,
          registro_fonte: registroId
        });
      }

      if (stakeholderData.contato_email && !existente.contato?.email) {
        updates.contato = { ...updates.contato, ...existente.contato, email: stakeholderData.contato_email };
        updates.historico_evolucao.push({
          data: new Date().toISOString(),
          campo_atualizado: 'email',
          valor_novo: stakeholderData.contato_email,
          registro_fonte: registroId
        });
      }

      if (stakeholderData.papel_social && !existente.papel_social) {
        updates.papel_social = stakeholderData.papel_social;
        updates.status_cadastro = 'parcial';
      }

      await base44.entities.Stakeholder.update(existente.id, updates);
      return existente.id;
    } else {
      // CRIAR NOVO STAKEHOLDER PROVISÓRIO
      const proximoId = stakeholders.reduce((max, s) => Math.max(max, s.id_sequencial || 0), 0) + 1;
      
      const novoStakeholder = await base44.entities.Stakeholder.create({
        id_sequencial: proximoId,
        nome: stakeholderData.nome,
        tipo: stakeholderData.tipo || 'pessoa',
        subtipo: inferirSubtipo(stakeholderData),
        comunidade: comunidade || 'A definir',
        municipio: stakeholderData.municipio || 'A definir',
        papel_social: stakeholderData.papel_social,
        organizacao: stakeholderData.organizacao,
        contato: {
          telefone: stakeholderData.contato_telefone || null,
          email: stakeholderData.contato_email || null
        },
        primeira_mencao: new Date().toISOString(),
        registro_origem: registroId,
        registros_vinculados: [registroId],
        historico_evolucao: [{
          data: new Date().toISOString(),
          campo_atualizado: 'criacao',
          valor_novo: 'Criado automaticamente pela IA',
          registro_fonte: registroId
        }],
        status_cadastro: 'provisorio',
        nivel_atividade: 'baixo',
        historico_interacoes: 1,
        ultima_interacao: new Date().toISOString().split('T')[0]
      });

      return novoStakeholder.id;
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar stakeholder:', error);
    return null;
  }
}

function inferirSubtipo(stakeholder) {
  if (stakeholder.tipo === 'entidade') {
    if (/associa[çc][ãa]o/i.test(stakeholder.nome)) return 'associacao';
    if (/ong|instituto|funda[çc][ãa]o/i.test(stakeholder.nome)) return 'ong';
    if (/prefeitura|secretaria|c[âa]mara/i.test(stakeholder.nome)) return 'governo';
    return 'outro';
  }

  if (/lideran[çc]a|presidente|coordenador/i.test(stakeholder.papel_social || '')) return 'lideranca';
  if (/representante|delegado/i.test(stakeholder.papel_social || '')) return 'representante';
  return 'morador';
}

async function criarOuAtualizarOrganizacao(organizacao, registroId) {
  try {
    const organizacoes = await base44.entities.ProjetoOrganizacao.list();
    const existente = organizacoes.find(o => 
      o.nome_oficial.toLowerCase() === organizacao.nome.toLowerCase()
    );

    if (existente) {
      await base44.entities.ProjetoOrganizacao.update(existente.id, {
        ultima_interacao: new Date().toISOString(),
        demandas_relacionadas: [...new Set([
          ...(existente.demandas_relacionadas || []),
          registroId
        ])]
      });
    } else {
      await base44.entities.ProjetoOrganizacao.create({
        nome_oficial: organizacao.nome,
        natureza: organizacao.tipo || 'outro',
        area_de_atuacao: organizacao.area,
        ultima_interacao: new Date().toISOString(),
        demandas_relacionadas: [registroId]
      });
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar organização:', error);
  }
}

function calcularData(prazoTexto) {
  const hoje = new Date();
  
  if (/\d+ dias?/.test(prazoTexto)) {
    const dias = parseInt(prazoTexto);
    hoje.setDate(hoje.getDate() + dias);
  } else if (/\d+ semanas?/.test(prazoTexto)) {
    const semanas = parseInt(prazoTexto);
    hoje.setDate(hoje.getDate() + (semanas * 7));
  } else if (/\d+ meses?/.test(prazoTexto)) {
    const meses = parseInt(prazoTexto);
    hoje.setMonth(hoje.getMonth() + meses);
  } else {
    hoje.setDate(hoje.getDate() + 30); // padrão: 30 dias
  }
  
  return hoje.toISOString().split('T')[0];
}