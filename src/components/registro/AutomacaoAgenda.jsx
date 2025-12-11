import { base44 } from '@/api/base44Client';

export async function criarAgendasAutomaticas(registro) {
  const agendasCriadas = [];
  
  try {
    // Criar agendas para compromissos com prazo
    if (registro.compromissos && registro.compromissos.length > 0) {
      for (const compromisso of registro.compromissos) {
        if (compromisso.prazo) {
          const agenda = await base44.entities.Agenda.create({
            titulo: compromisso.descricao,
            data: compromisso.prazo,
            tipo: 'devolutiva',
            comunidade: registro.comunidade,
            responsaveis: compromisso.responsavel ? [compromisso.responsavel] : [],
            status: 'prevista',
            descricao: `Compromisso assumido no registro: ${registro.titulo}`,
            registro_origem_id: registro.id
          });
          agendasCriadas.push(agenda.id);
        }
      }
    }

    // Criar agendas para demandas com devolutiva
    if (registro.demandas && registro.demandas.length > 0) {
      for (const demanda of registro.demandas) {
        if (demanda.requer_devolutiva && demanda.prazo_devolutiva) {
          const agenda = await base44.entities.Agenda.create({
            titulo: `Devolutiva: ${demanda.descricao.substring(0, 50)}...`,
            data: demanda.prazo_devolutiva,
            tipo: 'devolutiva',
            comunidade: registro.comunidade,
            status: 'prevista',
            descricao: `Devolutiva obrigatória para demanda registrada em: ${registro.titulo}`,
            registro_origem_id: registro.id
          });
          agendasCriadas.push(agenda.id);
        }
      }
    }

    // Atualizar registro com IDs das agendas
    if (agendasCriadas.length > 0) {
      await base44.entities.Registro.update(registro.id, {
        agendas_geradas: agendasCriadas
      });
    }

    return agendasCriadas;
  } catch (error) {
    console.error('Erro ao criar agendas automáticas:', error);
    return [];
  }
}

export async function atualizarHistoricoAtor(atorId, registroId) {
  try {
    const atores = await base44.entities.Ator.list();
    const ator = atores.find(a => a.id === atorId);
    
    if (ator) {
      await base44.entities.Ator.update(atorId, {
        historico_interacoes: (ator.historico_interacoes || 0) + 1,
        ultima_interacao: new Date().toISOString().split('T')[0]
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar histórico de ator:', error);
  }
}

export async function registrarAuditoria(entidadeTipo, entidadeId, campoAlterado, valorAnterior, valorNovo, tipoOperacao) {
  try {
    const user = await base44.auth.me();
    
    await base44.entities.HistoricoAuditoria.create({
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      campo_alterado: campoAlterado,
      valor_anterior: JSON.stringify(valorAnterior),
      valor_novo: JSON.stringify(valorNovo),
      tipo_operacao: tipoOperacao,
      usuario_responsavel: user.email,
      fonte_origem: 'interface_web',
      aprovacao_necessaria: false
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}