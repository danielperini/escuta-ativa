import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { registro } = await req.json();

    if (!registro) {
      return Response.json({ error: 'Registro não fornecido' }, { status: 400 });
    }

    // Buscar registros do mesmo território para contexto
    const registrosMesmoLocal = await base44.asServiceRole.entities.Registro.filter({
      comunidade: registro.comunidade || ''
    });

    const contextoHistorico = registrosMesmoLocal.length > 5 
      ? `Existem ${registrosMesmoLocal.length} registros anteriores nesta comunidade. ` +
        `Temas recorrentes: ${[...new Set(registrosMesmoLocal.flatMap(r => r.temas_identificados || []))].slice(0, 5).join(', ')}`
      : `Comunidade com poucos registros históricos (${registrosMesmoLocal.length} total).`;

    const prompt = `Você é um analista especialista em Relacionamento Comunitário, Risco Social, Gestão Territorial e ESG.

Analise o REGISTRO apresentado e classifique:
1. Se o caso é CRÍTICO ou NÃO CRÍTICO
2. A TEMPERATURA DO TERRITÓRIO em uma escala de 1 a 10
3. O LOCAL e a COMUNIDADE_TERRITORIAL

REGISTRO:
Título: ${registro.titulo || 'Sem título'}
Descrição: ${registro.descricao || 'Sem descrição'}
Transcrição: ${registro.transcricao || 'Não disponível'}
Tipo: ${registro.tipo || 'Não definido'}
Comunidade: ${registro.comunidade || 'Não especificada'}
Local: ${registro.local || 'Não especificado'}
Participantes: ${registro.participantes?.join(', ') || 'Não informados'}
Temas: ${registro.temas_identificados?.join(', ') || 'Não identificados'}
Demandas: ${registro.demandas?.map(d => d.descricao).join('; ') || 'Nenhuma'}
Sentimento: ${registro.sentimento || 'Não classificado'}

CONTEXTO HISTÓRICO DO TERRITÓRIO:
${contextoHistorico}

DEFINIÇÃO DE CASO CRÍTICO:
Casos críticos apresentam alto risco social, potencial de escalada rápida, ameaça à integridade física, risco iminente de perda de vidas ou ruptura grave da convivência social.

CRITÉRIOS DE CRITICIDADE:
A) Risco à Vida: ameaças, violência, dano físico
B) Escala: número de pessoas, mobilização, lideranças
C) Intensidade: linguagem agressiva, coação, intimidação
D) Repetição: tema recorrente no território
E) Histórico: conflitos anteriores, fragilidade institucional
F) Capacidade de Resposta: ausência de diálogo, baixa presença

TEMPERATURA DO TERRITÓRIO (1-10):
1-2: Baixa (isolado, neutro)
3-4: Moderada (recorrente, controlável)
5-6: Elevada (repetição, envolvimento de lideranças)
7-8: Alta (mobilização, pressão, risco real)
9-10: Crítica (ameaça à vida, escalada, ruptura)

COMUNIDADE TERRITORIAL:
- Preencher APENAS se houver menção a recorte territorial físico: bairro, vila, quilombo, aldeia, assentamento
- NÃO aceitar redes sociais ou comunidades online
- Se não houver, usar "Sem Registro"

Analise e retorne um JSON estruturado.`;

    const analise = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          local: { type: "string" },
          comunidade_territorial: { type: "string" },
          caso_critico: { type: "boolean" },
          temperatura_territorio: { type: "number", minimum: 1, maximum: 10 },
          justificativa: { type: "string" },
          recomendacao: { type: "string" }
        },
        required: ["local", "comunidade_territorial", "caso_critico", "temperatura_territorio", "justificativa", "recomendacao"]
      }
    });

    return Response.json({
      success: true,
      analise
    });

  } catch (error) {
    console.error('Erro ao analisar criticidade:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});