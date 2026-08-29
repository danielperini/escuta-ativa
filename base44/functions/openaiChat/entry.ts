import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import OpenAI from 'npm:openai@4.67.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'OPENAI_API_KEY não configurada. Defina em Configurações → Variáveis de Ambiente.' }, { status: 500 });
    }

    const body = await req.json();
    const { prompt, model, temperatura, max_tokens, contexto, json_schema } = body;
    if (!prompt) {
      return Response.json({ error: 'Informe o parâmetro "prompt".' }, { status: 400 });
    }

    const modelo = model || 'gpt-4o-mini';
    const openai = new OpenAI({ apiKey });

    const messages = [];
    if (contexto) {
      messages.push({ role: 'system', content: contexto });
    }
    messages.push({ role: 'user', content: prompt });

    const params = {
      model: modelo,
      messages,
      temperature: typeof temperatura === 'number' ? temperatura : 0.7,
    };

    if (typeof max_tokens === 'number') {
      params.max_tokens = max_tokens;
    }

    if (json_schema) {
      params.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'resultado',
          schema: json_schema,
          strict: true,
        },
      };
    }

    const response = await openai.chat.completions.create(params);
    const escolha = response.choices[0]?.message?.content;

    let resultado = escolha;
    if (json_schema && escolha) {
      try {
        resultado = JSON.parse(escolha);
      } catch (e) {
        // mantém o texto cru se falhar a parse
      }
    }

    return Response.json({
      resultado,
      modelo_usado: modelo,
      uso_tokens: {
        prompt: response.usage?.prompt_tokens,
        conclusao: response.usage?.completion_tokens,
        total: response.usage?.total_tokens,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});