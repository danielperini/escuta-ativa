import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cadernoNotaId, textoSelecionado, dadosRegistro } = await req.json();

    if (!cadernoNotaId || !dadosRegistro) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const caderno = await base44.entities.CadernoNota.get(cadernoNotaId);

    if (!caderno) {
      return Response.json({ error: 'Caderno não encontrado' }, { status: 404 });
    }

    // Criar registro com os dados fornecidos
    const registro = await base44.entities.Registro.create({
      ...dadosRegistro,
      transcricao: textoSelecionado || caderno.texto_extraido,
      arquivos: caderno.arquivos || [],
      status: 'rascunho'
    });

    // Atualizar caderno com referência ao registro
    const registrosRef = caderno.registros_referenciados || [];
    await base44.entities.CadernoNota.update(cadernoNotaId, {
      registros_referenciados: [...registrosRef, registro.id]
    });

    return Response.json({ 
      success: true, 
      registro_id: registro.id 
    });
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});