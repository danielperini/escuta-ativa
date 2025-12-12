import { base44 } from '@/api/base44Client';

/**
 * Processamento IA em LOTE ÚNICO
 * Extrai TUDO em uma chamada: temas, atores, demandas, compromissos, riscos, localização, sentimento
 */
export async function processarRegistroCompleto(textoConsolidado, comunidade) {
  try {
    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um sistema de análise territorial para registro comunitário.

TEXTO DO REGISTRO:
${textoConsolidado}

COMUNIDADE MENCIONADA: ${comunidade || 'não especificada'}

TAREFA: Extrair TODAS as informações relevantes em UMA ÚNICA ANÁLISE:

1. IDENTIFICAÇÃO BÁSICA
   - Título sugerido (máx 80 caracteres)
   - Tipo de registro (reuniao, conversa_campo, visita, demanda, ocorrencia)
   - Comunidade principal
   - Município (OBRIGATÓRIO)
   - Local específico

2. ANÁLISE DE CONTEÚDO
   - Temas identificados (lista)
   - Sentimento predominante (positivo, neutro, negativo, misto)
   - Temperatura do território (baixo, medio, alto, critico)
   - Resumo executivo (máx 200 palavras)

3. DEMANDAS
   Para cada demanda:
   - Descrição clara
   - Urgência (baixa, media, alta, critica)
   - Requer devolutiva? (sim/não)
   - Prazo sugerido para devolutiva

4. COMPROMISSOS ASSUMIDOS
   Para cada compromisso:
   - Descrição
   - Responsável (se mencionado)
   - Prazo sugerido
   - Prioridade (baixa, media, alta, urgente)

5. STAKEHOLDERS IDENTIFICADOS (PESSOAS E ENTIDADES)
   REGRA CRÍTICA: Incluir TODOS os nomes mencionados, mesmo incompletos
   
   Para cada pessoa mencionada:
   - Nome (mesmo incompleto: "Dona Maria", "Sr. João")
   - Tipo: pessoa ou entidade
   - Papel social (se mencionado)
   - Organização (se mencionado)
   - Contato (apenas se explicitamente dito)
   - Município (OBRIGATÓRIO - inferir do contexto)
   
   Para cada entidade mencionada:
   - Nome
   - Tipo (associacao, ong, governo, outro)
   - Área de atuação
   - Município

6. RISCOS SOCIAIS
   Se identificar riscos:
   - Título do risco
   - Nível (baixo, moderado, alto, critico)
   - Tipo de risco
   - Causas
   - Ações preventivas sugeridas

7. MATERIALIDADE
   - Temas prioritários para comunidade
   - Temas prioritários para empresa
   - Relevância comunitária (1-10)
   - Relevância corporativa (1-10)
   - Divergências identificadas

8. LOCALIZAÇÃO
   - Coordenadas aproximadas (lat/lng)
   - Se não houver endereço exato, usar centro do município

9. AGENDA FUTURA
   Se houver menção a:
   - Reuniões futuras
   - Datas acordadas
   - Prazos de devolutiva

10. PRÓXIMOS PASSOS
    - Lista de ações recomendadas

IMPORTANTE:
- Seja preciso e objetivo
- Não invente informações
- Se algo não estiver claro, marque como null
- Priorize qualidade sobre quantidade`,
      response_json_schema: {
        type: "object",
        properties: {
          identificacao: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              tipo: { type: "string", enum: ["reuniao", "conversa_campo", "visita", "demanda", "ocorrencia"] },
              comunidade: { type: "string" },
              municipio: { type: "string" },
              local: { type: "string" },
              resumo: { type: "string" }
            }
          },
          analise: {
            type: "object",
            properties: {
              temas: { type: "array", items: { type: "string" } },
              sentimento: { type: "string", enum: ["positivo", "neutro", "negativo", "misto"] },
              temperatura: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
              participantes: { type: "array", items: { type: "string" } }
            }
          },
          demandas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                descricao: { type: "string" },
                urgencia: { type: "string", enum: ["baixa", "media", "alta", "critica"] },
                requer_devolutiva: { type: "boolean" },
                prazo_sugerido: { type: "string" }
              }
            }
          },
          compromissos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                descricao: { type: "string" },
                responsavel: { type: "string" },
                prazo: { type: "string" },
                prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] }
              }
            }
          },
          stakeholders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                tipo: { type: "string", enum: ["pessoa", "entidade"] },
                papel_social: { type: "string" },
                organizacao: { type: "string" },
                municipio: { type: "string" },
                contato_telefone: { type: "string" },
                contato_email: { type: "string" }
              }
            }
          },
          riscos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                nivel: { type: "string", enum: ["baixo", "moderado", "alto", "critico"] },
                tipo: { type: "string" },
                causas: { type: "array", items: { type: "string" } },
                acoes_preventivas: { type: "array", items: { type: "string" } }
              }
            }
          },
          materialidade: {
            type: "object",
            properties: {
              temas_comunidade: { type: "array", items: { type: "string" } },
              temas_empresa: { type: "array", items: { type: "string" } },
              relevancia_comunidade: { type: "number" },
              relevancia_empresa: { type: "number" },
              divergencias: { type: "array", items: { type: "string" } }
            }
          },
          localizacao: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" },
              endereco: { type: "string" }
            }
          },
          agenda_futura: {
            type: "array",
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                data: { type: "string" },
                tipo: { type: "string" }
              }
            }
          },
          proximos_passos: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return resultado;
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