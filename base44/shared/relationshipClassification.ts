import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

// ===================================================================
// relationshipClassification.ts — Lógica compartilhada de classificação
// do tipo de relacionamento (Comunitário / Institucional / ambos).
//
// Usada por:
//   - analisarNovoRegistro (classificação automática na criação)
//   - classificarRelacionamentoRegistros (retroativa + reavaliação)
//
// Regra de prioridade: classificação MANUAL nunca é sobrescrita pela IA.
// Evidências (ata, transcrição, lista de presença, fotografia) não geram
// classificação independente — herdam a do registro principal.
// ===================================================================

export const CLASSIFICACAO_VALUES = ['COMUNITARIO', 'INSTITUCIONAL', 'COMUNITARIO_INSTITUCIONAL'] as const;

export const CLASSIFICACAO_LABELS: Record<string, string> = {
  COMUNITARIO: 'Relacionamento Comunitário',
  INSTITUCIONAL: 'Relacionamento Institucional',
  COMUNITARIO_INSTITUCIONAL: 'Relacionamento Comunitário e Institucional',
};

export const RELACIONAMENTO_RULES = `Você é o classificador de TIPO DE RELACIONAMENTO da societá.ai — Plataforma de relacionamento comunitário.

Classifique a atividade territorial em UMA das três categorias:

- COMUNITARIO — Relacionamento Comunitário
- INSTITUCIONAL — Relacionamento Institucional
- COMUNITARIO_INSTITUCIONAL — Relacionamento Comunitário e Institucional

RELACIONAMENTO COMUNITÁRIO quando o foco principal for interação, diálogo, escuta ou atuação junto a: comunidades, moradores, lideranças comunitárias, associações de moradores, coletivos territoriais, grupos comunitários, pessoas diretamente impactadas, públicos de determinado território. Fortes indicadores: assembleia comunitária, reunião com moradores, escuta, diálogo social, visita comunitária, consulta à comunidade, mobilização, encontro comunitário, reunião territorial, demanda comunitária.

RELACIONAMENTO INSTITUCIONAL quando o objetivo principal envolver articulação ou relacionamento entre organizações/instituições, incluindo: prefeitura, secretarias, órgãos públicos, Ministério Público, Defensoria Pública, Câmara Municipal, universidades, empresas, fundações, organizações da sociedade civil, conselhos, entidades parceiras, instituições públicas ou privadas.

COMUNITÁRIO E INSTITUCIONAL apenas quando os DOIS componentes forem materialmente relevantes para o OBJETIVO da atividade.

REGRAS CRÍTICAS:
1. NÃO classifique como misto (COMUNITARIO_INSTITUCIONAL) apenas porque um representante institucional participou de uma atividade comunitária. A participação isolada de um ator institucional não transforma uma atividade comunitária em mista.
2. O OBJETIVO PRINCIPAL da atividade determina a classificação — não a lista de presentes.
3. Exemplo: uma assembleia sobre uma ponte realizada com moradores de Aimorés continua sendo COMUNITARIO mesmo com representantes da prefeitura presentes, quando a finalidade principal é diálogo/escuta da comunidade.
4. Ata, transcrição, lista de presença e fotografia são EVIDÊNCIAS — jamais geram classificação independente; herdam a classificação do registro principal.
5. Decida pelo objetivo, não pela presença.

Retorne SOMENTE JSON: {"classificacao":"COMUNITARIO|INSTITUCIONAL|COMUNITARIO_INSTITUCIONAL","confianca":0.0-1.0,"justificativa":"string curta em português"}.`;

// Monta o contexto textual utilizado pela IA para classificar.
// Considera: título, descrição, tipo, território, participantes, organizações,
// stakeholders, transcrição, ata, documentos, evidências e temas.
export function montarContextoClassificacao(registro: any): string {
  const partes: string[] = [];
  if (registro?.titulo) partes.push(`Título: ${registro.titulo}`);
  if (registro?.tipo) partes.push(`Tipo da atividade: ${registro.tipo}`);
  if (registro?.descricao) partes.push(`Descrição: ${(registro.descricao || '').slice(0, 3000)}`);
  const territorio = [registro?.comunidade, registro?.localizacao?.municipio, registro?.localizacao?.estado]
    .filter(Boolean).join(' - ');
  if (territorio) partes.push(`Território: ${territorio}`);
  if (registro?.participantes?.length) partes.push(`Participantes: ${registro.participantes.join(', ')}`);
  if (registro?.organizacao) partes.push(`Organização: ${registro.organizacao}`);
  if (registro?.grupo_coletivo) partes.push(`Grupo/Coletivo: ${registro.grupo_coletivo}`);
  if (registro?.liderancas_vinculadas?.length) partes.push(`Lideranças vinculadas: ${registro.liderancas_vinculadas.length}`);
  if (registro?.organizacoes_vinculadas?.length) partes.push(`Organizações vinculadas: ${registro.organizacoes_vinculadas.length}`);
  if (registro?.temas_identificados?.length) partes.push(`Temas identificados: ${registro.temas_identificados.join(', ')}`);
  if (registro?.tipo_demanda) partes.push(`Tipo de demanda: ${registro.tipo_demanda}`);
  if (registro?.demandas?.length) {
    partes.push(`Demandas: ${registro.demandas.map((d: any) => d?.descricao).filter(Boolean).join('; ')}`);
  }
  if (registro?.transcricao) partes.push(`Transcrição: ${(registro.transcricao).slice(0, 4000)}`);
  if (registro?.ata_gerada) partes.push(`Ata: ${(registro.ata_gerada).slice(0, 4000)}`);
  if (registro?.arquivos?.length) {
    const nomes = registro.arquivos.map((a: any) => a?.nome).filter(Boolean);
    if (nomes.length) partes.push(`Documentos/evidências anexos: ${nomes.join(', ')}`);
    const transcricoes = registro.arquivos.map((a: any) => a?.transcricao).filter(Boolean).join(' \n');
    if (transcricoes) partes.push(`Transcrições de anexos: ${transcricoes.slice(0, 3000)}`);
  }
  return partes.join('\n');
}

// Chama a IA (OpenAI) e devolve a classificação + confiança + justificativa.
// Lana em caso de erro de parse.
export async function classificarRelacionamentoViaIA(
  openai: OpenAI,
  registro: any
): Promise<{ classificacao: string; confianca: number; justificativa: string }> {
  const contexto = montarContextoClassificacao(registro);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RELACIONAMENTO_RULES },
      {
        role: 'user',
        content: `Classifique o tipo de relacionamento da atividade abaixo.\n\n${contexto}\n\nRetorne SOMENTE o JSON especificado.`,
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);
  const classificacao = CLASSIFICACAO_VALUES.includes(parsed.classificacao)
    ? parsed.classificacao
    : 'COMUNITARIO';
  const confianca = typeof parsed.confianca === 'number' ? parsed.confianca : 0.6;
  const justificativa = typeof parsed.justificativa === 'string' ? parsed.justificativa : '';
  return { classificacao, confianca, justificativa };
}

// True quando a classificação atual NÃO é manual (pode ser sobrescrita pela IA).
// Manual tem prioridade e nunca é sobrescrita automaticamente.
export function podeSobrescreverClassificacao(registro: any): boolean {
  const rc = registro?.relationship_classification;
  return !rc || rc.origem !== 'manual';
}

// Cria o objeto de classificação a ser persistido.
export function montarClassificacao(
  classificacao: string,
  origem: 'manual' | 'ia',
  opts: { confianca?: number; justificativa?: string; usuarioEmail?: string } = {}
): any {
  return {
    classificacao,
    origem,
    data_classificacao: new Date().toISOString(),
    confianca_ia: origem === 'ia' ? (opts.confianca ?? null) : null,
    justificativa: opts.justificativa || '',
    usuario_responsavel: origem === 'manual' ? (opts.usuarioEmail || '') : '',
  };
}

// Registra auditoria da alteração de classificação no HistoricoAuditoria.
export async function registrarAuditoriaClassificacao(
  base44: any,
  entidadeId: string,
  anterior: any,
  nova: any,
  origem: 'manual' | 'ia'
): Promise<void> {
  try {
    const valorAnterior = anterior?.classificacao
      ? `${anterior.classificacao} (${anterior.origem || 'ia'})`
      : 'sem classificação';
    const valorNovo = `${nova.classificacao} (${origem})`;
    await base44.entities.HistoricoAuditoria.create({
      entidade_tipo: 'Registro',
      entidade_id: entidadeId,
      campo_alterado: 'relationship_classification',
      valor_anterior: valorAnterior,
      valor_novo: valorNovo,
      tipo_operacao: 'atualizacao',
      usuario_responsavel: nova.usuario_responsavel || (origem === 'ia' ? 'sistema_ia' : ''),
      justificativa: nova.justificativa || '',
      fonte_origem: origem === 'ia' ? 'classificacao_ia' : 'classificacao_manual',
    });
  } catch (e) {
    // auditoria é best-effort: não derrubar o fluxo principal
  }
}