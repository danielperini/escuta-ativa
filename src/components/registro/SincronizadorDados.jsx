import { base44 } from '@/api/base44Client';

/**
 * Sincroniza dados após criação/atualização de registro
 * Atualiza: comunidades, temas, atores, termômetro
 */
export async function sincronizarAposRegistro(registro) {
  try {
    await Promise.all([
      atualizarComunidade(registro),
      atualizarTemas(registro),
      atualizarTermometro(registro)
    ]);
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

async function atualizarComunidade(registro) {
  if (!registro.comunidade) return;
  
  try {
    const comunidades = await base44.entities.Comunidade.list();
    const comunidade = comunidades.find(c => c.nome === registro.comunidade);
    
    if (comunidade) {
      const registrosDaComunidade = await base44.entities.Registro.filter(
        { comunidade: registro.comunidade },
        '-created_date',
        50
      );
      
      await base44.entities.Comunidade.update(comunidade.id, {
        total_registros: registrosDaComunidade.length,
        ultima_interacao: new Date().toISOString().split('T')[0],
        principais_temas: [...new Set(
          registrosDaComunidade.flatMap(r => r.temas_identificados || [])
        )].slice(0, 5)
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar comunidade:', error);
  }
}

async function atualizarTemas(registro) {
  if (!registro.temas_identificados || registro.temas_identificados.length === 0) return;
  
  try {
    const temas = await base44.entities.Tema.list();
    
    for (const temaNome of registro.temas_identificados) {
      const temaExistente = temas.find(t => 
        t.nome.toLowerCase() === temaNome.toLowerCase()
      );
      
      if (temaExistente) {
        await base44.entities.Tema.update(temaExistente.id, {
          mencoes_total: (temaExistente.mencoes_total || 0) + 1,
          ultima_mencao: new Date().toISOString().split('T')[0],
          comunidades_afetadas: [...new Set([
            ...(temaExistente.comunidades_afetadas || []),
            registro.comunidade
          ])]
        });
      } else {
        // Criar tema automaticamente
        await base44.entities.Tema.create({
          nome: temaNome,
          categoria: 'outro',
          relevancia_comunidade: 5,
          relevancia_empresa: 5,
          mencoes_total: 1,
          ultima_mencao: new Date().toISOString().split('T')[0],
          comunidades_afetadas: [registro.comunidade],
          tendencia: 'estavel'
        });
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar temas:', error);
  }
}

async function atualizarTermometro(registro) {
  if (!registro.comunidade || !registro.temperatura_territorio) return;
  
  try {
    const comunidades = await base44.entities.Comunidade.list();
    const comunidade = comunidades.find(c => c.nome === registro.comunidade);
    
    if (comunidade) {
      // Lógica simples: pegar a maior temperatura dos últimos 10 registros
      const registrosRecentes = await base44.entities.Registro.filter(
        { comunidade: registro.comunidade },
        '-created_date',
        10
      );
      
      const temperaturas = registrosRecentes
        .map(r => r.temperatura_territorio)
        .filter(Boolean);
      
      const niveis = { critico: 4, alto: 3, medio: 2, baixo: 1 };
      const maiorNivel = Math.max(...temperaturas.map(t => niveis[t] || 1));
      const termometroAtualizado = Object.keys(niveis).find(k => niveis[k] === maiorNivel) || 'baixo';
      
      await base44.entities.Comunidade.update(comunidade.id, {
        termometro_social: termometroAtualizado
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar termômetro:', error);
  }
}

export async function atualizarLocalizacaoRegistro(registroId, localizacao) {
  try {
    await base44.entities.Registro.update(registroId, {
      localizacao: {
        lat: localizacao.lat,
        lng: localizacao.lng,
        endereco: localizacao.endereco || ''
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
  }
}