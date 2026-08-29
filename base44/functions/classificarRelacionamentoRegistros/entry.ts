import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';
import {
  classificarRelacionamentoViaIA,
  montarClassificacao,
  podeSobrescreverClassificacao,
  registrarAuditoriaClassificacao,
} from '../../shared/relationshipClassification.ts';

// ===================================================================
// classificarRelacionamentoRegistros
//
// Classificação do tipo de relacionamento (Comunitário / Institucional /
// ambos) para registros de campo da societá.ai.
//
// Modos de uso:
//  1. Retroativa (sem registro_id): processa registros que ainda NÃO possuem
//     relationship_classification ou cuja classificação NÃO é manual.
//     Registros com classificação MANUAL NUNCA são alterados.
//  2. Reavaliação de um registro (registro_id): a IA reavalia (ex.: novos
//     documentos/participantes/transcrições). Se houver classificação
//     manual, a IA apenas SUGERE (não substitui); o usuário confirma.
//
// Regra de segurança: classificação manual > classificação IA.
// ===================================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const registroId = String(body?.registro_id || '').trim();
    const limit = Math.min(Number(body?.limit || 200), 500);

    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });

    let registros: any[] = [];
    if (registroId) {
      registros = await base44.entities.Registro.filter({ id: registroId });
    } else {
      const todos = await base44.entities.Registro.list('-created_date', limit);
      registros = todos.filter((r) => podeSobrescreverClassificacao(r));
    }

    const resultados: any[] = [];
    let aplicados = 0;
    let sugestoes = 0;
    let erros = 0;

    for (const registro of registros) {
      try {
        const analise = await classificarRelacionamentoViaIA(openai, registro);
        const manualBloqueia = !podeSobrescreverClassificacao(registro);

        if (manualBloqueia) {
          sugestoes++;
          resultados.push({
            registro_id: registro.id,
            titulo: registro.titulo,
            sugestao_ia: analise,
            aplicado: false,
            motivo: 'classificação manual existente — IA apenas sugere',
          });
          continue;
        }

        const nova = montarClassificacao(analise.classificacao, 'ia', {
          confianca: analise.confianca,
          justificativa: analise.justificativa,
        });

        await base44.entities.Registro.update(registro.id, {
          relationship_classification: nova,
        });
        await registrarAuditoriaClassificacao(
          base44,
          registro.id,
          registro.relationship_classification,
          nova,
          'ia'
        );
        aplicados++;
        resultados.push({
          registro_id: registro.id,
          titulo: registro.titulo,
          classificacao: analise.classificacao,
          confianca: analise.confianca,
          aplicado: true,
        });
      } catch (err) {
        erros++;
        resultados.push({
          registro_id: registro.id,
          titulo: registro.titulo,
          erro: err?.message || 'erro na classificação',
        });
      }
    }

    return Response.json({
      success: true,
      modo: registroId ? 'reavaliacao' : 'retroativa',
      total_processados: registros.length,
      aplicados,
      sugestoes,
      erros,
      resultados,
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || 'Erro ao classificar relacionamento.' },
      { status: 500 }
    );
  }
}