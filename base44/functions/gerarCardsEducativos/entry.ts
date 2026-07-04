import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Gerar 150 cards usando LLM
    const prompt = `Você é um especialista em Relacionamento Comunitário, Diálogo Social e ESG, com base em sociologia aplicada, participação social e gestão territorial.

Gere EXATAMENTE 150 cards educativos para um aplicativo sobre Relacionamento Comunitário, inspirados nos princípios do livro "Relacionamento Comunitário: um Diálogo Social", de Daniel Perini Santos.

CATEGORIAS (distribuir equilibradamente):
1. Escuta e Diálogo (15 cards)
2. Presença no Território (15 cards)
3. Participação Social (15 cards)
4. Conflitos e Mediação (15 cards)
5. Confiança e Legitimidade (15 cards)
6. Ética e Responsabilidade (15 cards)
7. Materialidade e ESG (15 cards)
8. Redes Comunitárias (15 cards)
9. Planejamento e Governança (15 cards)
10. Riscos Sociais (15 cards)

TEMAS A COBRIR:
- Escuta ativa e qualificada
- Presença territorial consistente
- Construção de confiança
- Gestão de expectativas
- Mediação de conflitos
- Participação legítima
- Transparência e accountability
- Redes de relacionamento
- Governança participativa
- Análise de risco social
- Materialidade socioambiental
- Devolutivas responsáveis
- Diálogo intercultural
- Equidade e inclusão
- Responsabilidade corporativa
- Poder e assimetrias
- Territorialização
- Stakeholder engagement
- Licença social para operar
- Impactos cumulativos

REGRAS:
- Cada texto entre 300-500 caracteres
- Linguagem clara e profissional
- Contexto brasileiro
- Sem emojis
- Sem citações diretas
- Títulos únicos e descritivos
- Textos práticos e reflexivos

Retorne APENAS um array JSON válido com 150 objetos, sem texto adicional.`;

    const resultado = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                titulo: { type: "string" },
                texto: { type: "string" },
                categoria: { type: "string" }
              },
              required: ["id", "titulo", "texto", "categoria"]
            },
            minItems: 150,
            maxItems: 150
          }
        },
        required: ["cards"]
      }
    });

    // Inserir cards na base de dados
    const cards = resultado.cards.map(card => ({
      card_id: card.id,
      titulo: card.titulo,
      texto: card.texto,
      categoria: card.categoria,
      ordem: card.id,
      ativo: true,
      visualizacoes: 0,
      curtidas: 0
    }));

    // Inserir em lotes de 50
    const lotes = [];
    for (let i = 0; i < cards.length; i += 50) {
      lotes.push(cards.slice(i, i + 50));
    }

    let totalInseridos = 0;
    for (const lote of lotes) {
      await base44.asServiceRole.entities.CardEducativo.bulkCreate(lote);
      totalInseridos += lote.length;
    }

    return Response.json({
      success: true,
      total_gerados: cards.length,
      total_inseridos: totalInseridos,
      message: `${totalInseridos} cards educativos gerados e inseridos com sucesso!`
    });

  } catch (error) {
    console.error('Erro ao gerar cards:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});