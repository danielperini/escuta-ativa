import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cadernoNotaId, arquivos } = await req.json();

    if (!cadernoNotaId || !arquivos || arquivos.length === 0) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    let textoExtraido = '';
    const arquivosProcessados = [];

    for (const arquivo of arquivos) {
      try {
        let prompt = '';
        
        if (arquivo.tipo === 'audio' || arquivo.tipo === 'video') {
          prompt = `Transcreva este ${arquivo.tipo} em português brasileiro. Retorne APENAS o texto transcrito, sem comentários. Use pontuação correta e identifique falantes se houver.`;
        } else if (arquivo.tipo === 'foto' || arquivo.tipo === 'documento') {
          prompt = `Extraia TODO o texto deste documento/imagem. Preserve estrutura e formatação. Não omita nenhuma seção.`;
        }

        if (prompt) {
          const resultado = await base44.integrations.Core.InvokeLLM({
            prompt,
            file_urls: [arquivo.url]
          });

          if (resultado && resultado.length > 3) {
            textoExtraido += `\n\n--- ${arquivo.nome} ---\n${resultado}`;
            arquivosProcessados.push({
              ...arquivo,
              texto_extraido: resultado,
              processado: true
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao processar arquivo ${arquivo.nome}:`, error);
        arquivosProcessados.push({
          ...arquivo,
          erro: error.message,
          processado: false
        });
      }
    }

    await base44.asServiceRole.entities.CadernoNota.update(cadernoNotaId, {
      texto_extraido: textoExtraido.trim(),
      arquivos: arquivosProcessados,
      status: 'pronto'
    });

    return Response.json({ 
      success: true, 
      texto_extraido: textoExtraido.trim(),
      arquivos_processados: arquivosProcessados.length
    });
  } catch (error) {
    console.error('Erro ao processar conteúdo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});