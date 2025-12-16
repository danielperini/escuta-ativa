import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Função para transcrição de áudio/vídeo usando OpenAI Whisper
 * 
 * Payload:
 * - file_url: URL do arquivo de áudio/vídeo
 * - servico: 'openai' (padrão: openai)
 * - idioma: código do idioma (padrão: 'pt')
 * - opcoes: objeto com opções adicionais
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { file_url, servico = 'openai', idioma = 'pt', opcoes = {} } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
    }

    // Buscar API key e configurações do usuário com fallback para env
    const userConfig = user.configuracoes?.transcricao_externa || {};
    const OPENAI_API_KEY = userConfig.openai_key || Deno.env.get('OPENAI_API_KEY');
    const openaiConfig = userConfig.openai_config || {};

    let transcricao = '';
    let metadata = {};

    if (servico === 'openai') {
      if (!OPENAI_API_KEY) {
        return Response.json({ 
          error: 'OpenAI API Key não configurada. Configure em Configurações > Transcrição Externa.' 
        }, { status: 400 });
      }

      // OpenAI Whisper API
      const audioBlob = await fetch(file_url).then(res => res.blob());
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', openaiConfig.model || 'whisper-1');
      formData.append('language', openaiConfig.idioma || (idioma === 'pt' ? 'pt' : idioma));
      formData.append('response_format', openaiConfig.response_format || opcoes.response_format || 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI Whisper erro: ${errorData.error?.message || response.statusText}`);
      }

      const whisperData = await response.json();
      
      // Extrair transcrição baseado no formato
      if (whisperData.text) {
        transcricao = whisperData.text;
      } else if (whisperData.segments) {
        transcricao = whisperData.segments.map(s => s.text).join(' ');
      }

      metadata = {
        duracao_audio: whisperData.duration,
        palavras_count: transcricao.split(/\s+/).length,
        idioma_detectado: whisperData.language,
        servico: 'OpenAI Whisper'
      };

      if (whisperData.segments) {
        metadata.segmentos = whisperData.segments.length;
      }

    } else {
      return Response.json({ error: 'Serviço não suportado. Use "openai"' }, { status: 400 });
    }

    if (!transcricao || transcricao.trim().length < 3) {
      return Response.json({ 
        error: 'Transcrição vazia. Verifique se o áudio contém fala clara.' 
      }, { status: 400 });
    }

    return Response.json({
      sucesso: true,
      transcricao,
      metadata,
      file_url,
      servico
    });

  } catch (error) {
    console.error('Erro na transcrição externa:', error);
    return Response.json({ 
      error: error.message || 'Erro ao processar transcrição externa',
      detalhes: error.stack
    }, { status: 500 });
  }
});