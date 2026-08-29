import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.68.0';
import { secrets } from 'base44:runtime';

// ===================================================================
// motorDecisoesSocial — Motor Global de Decisões da societá.ai v1.0
//
// Fundamento metodológico: "Relacionamento Comunitário: um Diálogo Social"
// — Daniel Perini-Santos (methodology_source = DANIEL_PERINI_COMMUNITY_RELATIONS)
//
// O motor:
//   1. Analisa registros, demandas, devolutivas, riscos e agenda
//   2. Detecta padrões via REGRAS objetivas (prazos, ausências, contagens)
//   3. Enriquece com IA (interpretação semântica, sinais fracos, tendências)
//   4. Persiste DecisionInsight + DecisionEvidence sem caixa preta
//   5. NUNCA inventa fala, stakeholder, demanda ou causalidade
//
// Modos de disparo:
//   - evento: após criação/atualização de Registro, Demanda, Caso
//   - rotina_diaria: prazos, devolutivas, agenda
//   - rotina_semanal: análise longitudinal 7/30/90 dias
//
// Parâmetros:
//   { modo: "evento" | "rotina_diaria" | "rotina_semanal",
//     registro_id?: string,
//     comunidade?: string,
//     municipio?: string }
// ===================================================================

const MOTOR_VERSION = '1.0';

const SYSTEM_PROMPT_MOTOR = `Você é o Motor Global de Decisões da societá.ai, plataforma de relacionamento comunitário.

FUNDAMENTO METODOLÓGICO (use como camada interpretativa, não como evidência do território):
- Livro: "Relacionamento Comunitário: um Diálogo Social" — Daniel Perini-Santos
- Princípios: escuta contínua, leitura longitudinal, memória institucional, participação social,
  diversidade de vozes, presença territorial, materialidade construída pela experiência,
  confiança, legitimidade, accountability, devolutiva, gestão de demandas, antecipação de tensões.

HIERARQUIA DE INTERPRETAÇÃO:
1. Dados reais da societá.ai (registros, demandas, devolutivas, stakeholders, casos)
2. Histórico territorial (padrões longitudinais)
3. Metodologia Daniel Perini-Santos (como interpretar)
4. Dados públicos (contexto)

REGRAS INEGOCIÁVEIS:
- NÃO invente fala, stakeholder, demanda ou causalidade
- Percepção ≠ fato. Alegação ≠ fato comprovado
- Correlação ≠ causalidade. Dados municipais ≠ dados comunitários
- 1 registro isolado NÃO é tendência
- Demanda negada bem fundamentada NÃO é automaticamente "relacionamento ruim"
- Considere capacidade institucional antes de recomendar atendimento de demanda
- NUNCA trate ideologia política como variável de análise
- Nível de confiança SEMPRE explícito (BAIXA/MEDIA/ALTA)

TIPOS DE EVIDÊNCIA (classifique cada afirmação):
FATO_REGISTRADO | DADO_OFICIAL | PERCEPCAO | FALA | ALEGACAO | INFERENCIA | HIPOTESE | RECOMENDACAO

Retorne SOMENTE JSON válido no schema solicitado.`;

function diasAtras(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function isAntes(dataStr: string | undefined, limite: Date): boolean {
  if (!dataStr) return false;
  try {
    return new Date(dataStr) < limite;
  } catch { return false; }
}

function calcularConfiancaScore(evidencias: any[]): { score: number; nivel: string } {
  if (evidencias.length === 0) return { score: 10, nivel: 'BAIXA' };
  
  // Fatores: qtd evidências, diversidade fontes, diversidade stakeholders, qualidade
  const qtdScore = Math.min(evidencias.length * 10, 40); // max 40
  const fontesDiversas = new Set(evidencias.map((e: any) => e.entidade_tipo)).size;
  const diversidadeScore = Math.min(fontesDiversas * 10, 20); // max 20
  const qualidadeMedia = evidencias.reduce((sum: number, e: any) => sum + (e.peso || 3), 0) / evidencias.length;
  const qualidadeScore = Math.round((qualidadeMedia / 5) * 40); // max 40

  const total = qtdScore + diversidadeScore + qualidadeScore;
  const nivel = total >= 70 ? 'ALTA' : total >= 40 ? 'MEDIA' : 'BAIXA';
  return { score: total, nivel };
}

async function salvarInsight(base44: any, insightData: any, evidencias: any[]): Promise<string> {
  // Verifica se já existe insight ativo similar (mesmo tipo + comunidade + regra)
  try {
    const existentes = await base44.asServiceRole.entities.DecisionInsight.filter({
      tipo: insightData.tipo,
      status: 'ativo',
      regra_disparada: insightData.regra_disparada,
      comunidade_id: insightData.comunidade_id || ''
    }, '-last_detected_at', 1);

    if (existentes.length > 0) {
      // Atualiza insight existente
      const existente = existentes[0];
      const confianca = calcularConfiancaScore(evidencias);
      await base44.asServiceRole.entities.DecisionInsight.update(existente.id, {
        ...insightData,
        last_detected_at: new Date().toISOString(),
        evidencia_count: evidencias.length,
        confianca: confianca.nivel,
        confianca_score: confianca.score,
        trend: 'crescente' // foi atualizado = ainda ativo e crescendo
      });
      return existente.id;
    }
  } catch (_) {}

  // Cria novo insight
  const confianca = calcularConfiancaScore(evidencias);
  const created = await base44.asServiceRole.entities.DecisionInsight.create({
    ...insightData,
    first_detected_at: new Date().toISOString(),
    last_detected_at: new Date().toISOString(),
    evidencia_count: evidencias.length,
    confianca: confianca.nivel,
    confianca_score: confianca.score,
    versao_motor: MOTOR_VERSION,
    methodology_source: 'DANIEL_PERINI_COMMUNITY_RELATIONS'
  });
  return created.id;
}

async function salvarEvidencias(base44: any, insightId: string, evidencias: any[]) {
  for (const ev of evidencias.slice(0, 10)) {
    try {
      await base44.asServiceRole.entities.DecisionEvidence.create({
        insight_id: insightId,
        ...ev
      });
    } catch (_) {}
  }
}

// === REGRAS OBJETIVAS (sem IA) ===================================================

async function verificarDevolutivasPendentes(base44: any): Promise<any[]> {
  const insights = [];
  try {
    const registros = await base44.asServiceRole.entities.Registro.list('-updated_date', 200);
    
    // Agrupa por comunidade
    const porComunidade: { [key: string]: any[] } = {};
    registros.forEach((r: any) => {
      if (!r.comunidade) return;
      if (!porComunidade[r.comunidade]) porComunidade[r.comunidade] = [];
      porComunidade[r.comunidade].push(r);
    });

    for (const [comunidade, regs] of Object.entries(porComunidade)) {
      let demandasSemDevolutiva = 0;
      const evidencias: any[] = [];
      const demandasIds: string[] = [];

      for (const r of regs) {
        if (!Array.isArray(r.demandas)) continue;
        for (const d of r.demandas) {
          if (
            (d.status === 'atendida' || d.status === 'em_andamento') &&
            !d.devolutiva_realizada &&
            d.devolutiva_status !== 'realizada'
          ) {
            demandasSemDevolutiva++;
            demandasIds.push(r.id);
            evidencias.push({
              entidade_tipo: 'registro',
              entidade_id: r.id,
              entidade_titulo: r.titulo,
              comunidade: r.comunidade,
              municipio: r.localizacao?.municipio,
              data_ocorrencia: r.data_registro,
              trecho_relevante: `Demanda "${d.descricao?.slice(0, 80)}" com status "${d.status}" sem devolutiva`,
              peso_evidencia: 4,
              classificacao: 'FATO_REGISTRADO'
            });
          }
        }
      }

      if (demandasSemDevolutiva >= 2) {
        insights.push({
          tipo: 'DEVOLUTIVA_PENDENTE',
          titulo: `${demandasSemDevolutiva} demandas sem devolutiva — ${comunidade}`,
          resumo: `${demandasSemDevolutiva} demandas de "${comunidade}" estão atendidas ou em andamento mas sem registro de devolutiva ao território. A metodologia de relacionamento comunitário orienta que toda demanda tratada requer retorno formal à comunidade, independente do resultado.`,
          o_que_esta_acontecendo: `${demandasSemDevolutiva} demandas registradas em "${comunidade}" foram tratadas internamente mas não possuem devolutiva documentada.`,
          por_que_merece_atencao: 'Devolutiva é condição básica de legitimidade no relacionamento comunitário. Ausência de retorno ao território quebra o ciclo de confiança.',
          possiveis_caminhos: [
            'Organizar atividade de retorno ao território',
            'Comunicar resultados por canal adequado (reunião, WhatsApp, visita)',
            'Registrar devolutivas já realizadas que não foram documentadas'
          ],
          prioridade: demandasSemDevolutiva >= 5 ? 'ALTA' : 'MEDIA',
          comunidade_nome: comunidade,
          regra_disparada: 'devolutiva_pendente_por_comunidade',
          classificacao_evidencia: 'FATO_REGISTRADO',
          evidencias_ids: demandasIds.slice(0, 5),
          evidencias
        });
      }
    }
  } catch (e) {
    console.error('Erro em verificarDevolutivasPendentes:', e);
  }
  return insights;
}

async function verificarCompromissosEmRisco(base44: any): Promise<any[]> {
  const insights = [];
  try {
    const compromissos = await base44.asServiceRole.entities.Compromisso.list('-prazo', 100);
    const limite7dias = diasAtras(-7); // futuro = 7 dias à frente
    const hoje = new Date();

    const vencidos = compromissos.filter((c: any) =>
      c.status === 'pendente' && c.prazo && new Date(c.prazo) < hoje
    );
    const proximosVencer = compromissos.filter((c: any) =>
      c.status === 'pendente' && c.prazo &&
      new Date(c.prazo) >= hoje && new Date(c.prazo) <= limite7dias
    );

    if (vencidos.length > 0) {
      const evidencias = vencidos.slice(0, 5).map((c: any) => ({
        entidade_tipo: 'compromisso',
        entidade_id: c.id,
        entidade_titulo: c.titulo || c.descricao,
        data_ocorrencia: c.prazo,
        trecho_relevante: `Compromisso pendente vencido em ${c.prazo}`,
        peso_evidencia: 4,
        classificacao: 'FATO_REGISTRADO'
      }));
      insights.push({
        tipo: 'COMPROMISSO_EM_RISCO',
        titulo: `${vencidos.length} compromisso(s) vencido(s) sem conclusão`,
        resumo: `${vencidos.length} compromissos com prazo vencido ainda estão pendentes. Compromissos não cumpridos afetam diretamente a credibilidade institucional.`,
        o_que_esta_acontecendo: `${vencidos.length} compromissos passaram do prazo e permanecem com status "pendente".`,
        por_que_merece_atencao: 'Compromissos assumidos e não cumpridos são percebidos pela comunidade como quebra de confiança.',
        possiveis_caminhos: [
          'Revisar status de cada compromisso',
          'Comunicar à comunidade se houver mudança de prazo',
          'Encerrar formalmente compromissos obsoletos'
        ],
        prioridade: vencidos.length >= 3 ? 'ALTA' : 'MEDIA',
        regra_disparada: 'compromissos_vencidos',
        classificacao_evidencia: 'FATO_REGISTRADO',
        evidencias_ids: vencidos.slice(0, 5).map((c: any) => c.id),
        evidencias
      });
    }
  } catch (e) {}
  return insights;
}

async function verificarComunidadesSemInteracao(base44: any): Promise<any[]> {
  const insights = [];
  try {
    const comunidades = await base44.asServiceRole.entities.Comunidade.list('-updated_date', 100);
    const limite60dias = diasAtras(60);
    const limite90dias = diasAtras(90);

    for (const com of comunidades) {
      const ultimaInt = com.ultima_interacao;
      if (!ultimaInt) continue;
      
      const dias = Math.round((Date.now() - new Date(ultimaInt).getTime()) / (1000 * 60 * 60 * 24));
      if (dias >= 90) {
        insights.push({
          tipo: 'NECESSIDADE_DE_ESCUTA',
          titulo: `${com.nome}: sem interação há ${dias} dias`,
          resumo: `A comunidade "${com.nome}" não possui registro de interação há ${dias} dias. Presença territorial contínua é fundamento do relacionamento comunitário.`,
          o_que_esta_acontecendo: `Último registro com "${com.nome}" data de ${ultimaInt?.slice(0, 10) || 'data desconhecida'}.`,
          por_que_merece_atencao: 'A ausência prolongada de interação fragiliza vínculos, reduz a percepção de presença institucional e pode gerar acúmulo silencioso de demandas.',
          possiveis_caminhos: [
            `Agendar visita de escuta à comunidade ${com.nome}`,
            'Verificar se há demandas pendentes não registradas',
            'Contatar lideranças conhecidas para atualização'
          ],
          prioridade: dias >= 120 ? 'ALTA' : 'MEDIA',
          comunidade_id: com.id,
          comunidade_nome: com.nome,
          municipio: com.municipio,
          regra_disparada: 'comunidade_sem_interacao_90d',
          classificacao_evidencia: 'FATO_REGISTRADO',
          evidencias_ids: [com.id],
          evidencias: [{
            entidade_tipo: 'registro',
            entidade_id: com.id,
            entidade_titulo: `Comunidade ${com.nome}`,
            comunidade: com.nome,
            municipio: com.municipio,
            data_ocorrencia: ultimaInt?.slice(0, 10),
            trecho_relevante: `Última interação: ${ultimaInt?.slice(0, 10)}. Sem interação há ${dias} dias.`,
            peso_evidencia: 3,
            classificacao: 'FATO_REGISTRADO'
          }]
        });
      }
    }
  } catch (e) {}
  return insights;
}

// === ANÁLISE COM IA (para padrões semânticos) ===========================================

async function analisarPadroesComIA(
  openai: any,
  registros: any[],
  demandas: any[],
  comunidade: string,
  municipio: string,
  janelaDias: number
): Promise<any[]> {
  if (registros.length < 2) return []; // sem dados suficientes para padrão

  const resumoRegistros = registros.slice(0, 15).map((r: any) => ({
    id: r.id?.slice(-6),
    titulo: r.titulo,
    tipo: r.tipo,
    temas: (r.temas_identificados || []).slice(0, 5),
    sentimento: r.sentimento,
    temperatura: r.temperatura_territorio,
    data: r.data_registro,
    demandas_count: Array.isArray(r.demandas) ? r.demandas.length : 0
  }));

  const resumoDemandas = demandas.slice(0, 10).map((d: any) => ({
    descricao: d.descricao?.slice(0, 100),
    urgencia: d.urgencia,
    status: d.status,
    comunidade: d.comunidade
  }));

  const prompt = `Você é o Motor de Decisões da societá.ai. Analise os dados abaixo e identifique APENAS padrões com EVIDÊNCIA REAL nos dados (não invente).

TERRITÓRIO: ${comunidade || municipio || 'não especificado'}
JANELA TEMPORAL: ${janelaDias} dias
REGISTROS (${registros.length} total, ${resumoRegistros.length} amostrados):
${JSON.stringify(resumoRegistros, null, 2)}

DEMANDAS (${demandas.length} total, ${resumoDemandas.length} amostradas):
${JSON.stringify(resumoDemandas, null, 2)}

Retorne JSON com array "insights" (máx 3 insights por chamada). Para cada insight, inclua SOMENTE se houver evidência nos dados acima:
{
  "insights": [
    {
      "tipo": "TENDENCIA|RECORRENCIA|SINAL_FRACO|TEMA_EM_CRESCIMENTO|MUDANCA_DE_PERCEPCAO",
      "titulo": "string curto",
      "resumo": "string (base nos dados, sem inventar)",
      "o_que_esta_acontecendo": "string factual",
      "por_que_merece_atencao": "string",
      "possiveis_caminhos": ["string"],
      "prioridade": "CRITICA|ALTA|MEDIA|BAIXA|MONITORAR",
      "temas": ["string"],
      "classificacao_evidencia": "FATO_REGISTRADO|PERCEPCAO|INFERENCIA|HIPOTESE",
      "evidencias_ids": ["id da amostra de registro"],
      "confianca_justificativa": "string"
    }
  ]
}

REGRAS:
- Se não há padrão claro, retorne {"insights": []}
- 1 registro isolado NÃO é tendência
- Percepção comunitária NÃO é fato comprovado
- Indique classificacao_evidencia corretamente
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.15,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_MOTOR },
        { role: 'user', content: prompt }
      ]
    });
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result.insights || [];
  } catch (e) {
    console.error('Erro na análise IA:', e);
    return [];
  }
}

// === HANDLER PRINCIPAL =================================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const openai = new OpenAI({ apiKey: secrets.get('OPENAI_API_KEY') });

    const body = await req.json().catch(() => ({}));
    const modo = body.modo || 'rotina_diaria';
    const registroId = body.registro_id || null;
    const filtroMunicipio = body.municipio || null;
    const filtroComunidade = body.comunidade || null;

    const insightsCriados: string[] = [];
    const erros: string[] = [];

    // ============================================================
    // MODO EVENTO: análise incremental de um registro específico
    // ============================================================
    if (modo === 'evento' && registroId) {
      try {
        const registro = await base44.asServiceRole.entities.Registro.get(registroId);
        if (!registro) return Response.json({ error: 'Registro não encontrado' }, { status: 404 });

        // Busca histórico da comunidade para contexto longitudinal
        const comunidade = registro.comunidade;
        const municipio = registro.localizacao?.municipio;
        
        const historico = comunidade
          ? await base44.asServiceRole.entities.Registro.filter(
              { comunidade },
              '-data_registro', 30
            )
          : [];

        const insightsIA = await analisarPadroesComIA(
          openai,
          historico.length > 0 ? historico : [registro],
          [],
          comunidade || '',
          municipio || '',
          90
        );

        for (const insight of insightsIA) {
          try {
            const evidencias = (insight.evidencias_ids || []).map((id: string) => ({
              entidade_tipo: 'registro',
              entidade_id: id,
              entidade_titulo: `Registro ${id}`,
              comunidade: comunidade || '',
              classificacao: insight.classificacao_evidencia || 'INFERENCIA',
              peso_evidencia: 3
            }));

            const id = await salvarInsight(base44, {
              tipo: insight.tipo,
              titulo: insight.titulo,
              resumo: insight.resumo,
              o_que_esta_acontecendo: insight.o_que_esta_acontecendo,
              por_que_merece_atencao: insight.por_que_merece_atencao,
              possiveis_caminhos: insight.possiveis_caminhos || [],
              prioridade: insight.prioridade,
              comunidade_nome: comunidade,
              municipio: municipio,
              temas: insight.temas || [],
              regra_disparada: `evento_registro_ia`,
              classificacao_evidencia: insight.classificacao_evidencia || 'INFERENCIA',
              evidencias_ids: insight.evidencias_ids || [registroId],
              status: 'ativo',
              periodo_analise: { janela_dias: 90 }
            }, evidencias);
            
            await salvarEvidencias(base44, id, evidencias);
            insightsCriados.push(id);
          } catch (e: any) {
            erros.push(`insight_evento: ${e.message}`);
          }
        }
      } catch (e: any) {
        erros.push(`modo_evento: ${e.message}`);
      }
    }

    // ============================================================
    // MODO ROTINA DIÁRIA: regras objetivas + análise de comunidades
    // ============================================================
    if (modo === 'rotina_diaria' || modo === 'rotina_semanal') {
      
      // 1. Devolutivas pendentes (regra objetiva)
      const insightsDevol = await verificarDevolutivasPendentes(base44);
      for (const ins of insightsDevol) {
        try {
          const { evidencias, ...dados } = ins;
          const id = await salvarInsight(base44, dados, evidencias);
          await salvarEvidencias(base44, id, evidencias);
          insightsCriados.push(id);
        } catch (e: any) { erros.push(`devol: ${e.message}`); }
      }

      // 2. Compromissos em risco (regra objetiva)
      const insightsComp = await verificarCompromissosEmRisco(base44);
      for (const ins of insightsComp) {
        try {
          const { evidencias, ...dados } = ins;
          const id = await salvarInsight(base44, dados, evidencias);
          await salvarEvidencias(base44, id, evidencias);
          insightsCriados.push(id);
        } catch (e: any) { erros.push(`comp: ${e.message}`); }
      }

      // 3. Comunidades sem interação (regra objetiva)
      const insightsCom = await verificarComunidadesSemInteracao(base44);
      for (const ins of insightsCom) {
        try {
          const { evidencias, ...dados } = ins;
          const id = await salvarInsight(base44, dados, evidencias);
          await salvarEvidencias(base44, id, evidencias);
          insightsCriados.push(id);
        } catch (e: any) { erros.push(`sem_int: ${e.message}`); }
      }
    }

    // ============================================================
    // MODO ROTINA SEMANAL: análise longitudinal por IA
    // ============================================================
    if (modo === 'rotina_semanal') {
      try {
        const limite30dias = diasAtras(30).toISOString().slice(0, 10);
        
        // Busca registros recentes para análise longitudinal
        const registrosRecentes = await base44.asServiceRole.entities.Registro.list('-data_registro', 60);
        const filtrados = filtroMunicipio
          ? registrosRecentes.filter((r: any) =>
              (r.localizacao?.municipio || '').toLowerCase().includes(filtroMunicipio.toLowerCase()))
          : registrosRecentes;

        // Agrupa por comunidade para análise focalizada
        const porComunidade: { [key: string]: any[] } = {};
        filtrados.forEach((r: any) => {
          const key = r.comunidade || r.localizacao?.municipio || 'sem_comunidade';
          if (!porComunidade[key]) porComunidade[key] = [];
          porComunidade[key].push(r);
        });

        // Analisa até 3 comunidades mais ativas
        const comunidadesOrdenadas = Object.entries(porComunidade)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 3);

        for (const [comunidade, regs] of comunidadesOrdenadas) {
          if (regs.length < 2) continue;
          
          const municipio = regs[0]?.localizacao?.municipio || '';
          const insightsIA = await analisarPadroesComIA(
            openai, regs, [], comunidade, municipio, 30
          );

          for (const insight of insightsIA) {
            try {
              const evidencias = (insight.evidencias_ids || []).map((id: string) => ({
                entidade_tipo: 'registro',
                entidade_id: id,
                entidade_titulo: `Registro ${id}`,
                comunidade,
                classificacao: insight.classificacao_evidencia || 'INFERENCIA',
                peso_evidencia: 3
              }));

              const id = await salvarInsight(base44, {
                tipo: insight.tipo,
                titulo: insight.titulo,
                resumo: insight.resumo,
                o_que_esta_acontecendo: insight.o_que_esta_acontecendo,
                por_que_merece_atencao: insight.por_que_merece_atencao,
                possiveis_caminhos: insight.possiveis_caminhos || [],
                prioridade: insight.prioridade,
                comunidade_nome: comunidade,
                municipio,
                temas: insight.temas || [],
                regra_disparada: 'rotina_semanal_ia',
                classificacao_evidencia: insight.classificacao_evidencia || 'INFERENCIA',
                evidencias_ids: insight.evidencias_ids || [],
                status: 'ativo',
                periodo_analise: { janela_dias: 30 }
              }, evidencias);

              await salvarEvidencias(base44, id, evidencias);
              insightsCriados.push(id);
            } catch (e: any) { erros.push(`semanal_ia: ${e.message}`); }
          }
          
          // Delay entre comunidades para não sobrecarregar
          await new Promise(res => setTimeout(res, 500));
        }
      } catch (e: any) {
        erros.push(`rotina_semanal: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      modo,
      insights_criados: insightsCriados.length,
      ids: insightsCriados,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (err: any) {
    return Response.json({ error: err.message || 'Erro no Motor de Decisões' }, { status: 500 });
  }
}