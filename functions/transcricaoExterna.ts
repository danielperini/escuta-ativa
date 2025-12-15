import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Função para transcrição de áudio/vídeo usando serviços externos
 * Suporta: AssemblyAI e Google Speech-to-Text
 * 
 * Payload:
 * - file_url: URL do arquivo de áudio/vídeo (já enviado via UploadFile)
 * - servico: 'assemblyai' | 'google' (padrão: assemblyai)
 * - idioma: código do idioma (padrão: 'pt')
 * - opcoes: objeto com opções adicionais (speaker_labels, punctuate, etc)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { file_url, servico = 'assemblyai', idioma = 'pt', opcoes = {} } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url é obrigatório' }, { status: 400 });
    }

    // Buscar API keys das secrets
    const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');
    const GOOGLE_SPEECH_API_KEY = Deno.env.get('GOOGLE_SPEECH_API_KEY');

    let transcricao = '';
    let metadata = {};

    if (servico === 'assemblyai') {
      if (!ASSEMBLYAI_API_KEY) {
        return Response.json({ 
          error: 'AssemblyAI API Key não configurada. Configure em Configurações > Transcrição Externa.' 
        }, { status: 400 });
      }

      // PASSO 1: Enviar arquivo para AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
        },
        body: await fetch(file_url).then(res => res.blob())
      });

      if (!uploadResponse.ok) {
        throw new Error(`Erro ao enviar arquivo para AssemblyAI: ${uploadResponse.statusText}`);
      }

      const { upload_url } = await uploadResponse.json();

      // PASSO 2: Solicitar transcrição
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLYAI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          language_code: idioma === 'pt' ? 'pt' : idioma,
          punctuate: opcoes.punctuate !== false,
          format_text: opcoes.format_text !== false,
          speaker_labels: opcoes.speaker_labels || false,
          auto_chapters: opcoes.auto_chapters || false,
          sentiment_analysis: opcoes.sentiment_analysis || false,
        })
      });

      if (!transcriptResponse.ok) {
        throw new Error(`Erro ao criar transcrição: ${transcriptResponse.statusText}`);
      }

      const transcript = await transcriptResponse.json();
      const transcriptId = transcript.id;

      // PASSO 3: Aguardar conclusão da transcrição (polling)
      let status = 'queued';
      let tentativas = 0;
      const maxTentativas = 60; // 5 minutos máximo

      while ((status === 'queued' || status === 'processing') && tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s
        
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'authorization': ASSEMBLYAI_API_KEY
          }
        });

        const statusData = await statusResponse.json();
        status = statusData.status;

        if (status === 'completed') {
          transcricao = statusData.text;
          
          metadata = {
            duracao_audio: statusData.audio_duration,
            palavras_count: statusData.words?.length || 0,
            confianca: statusData.confidence,
            transcript_id: transcriptId,
            servico: 'AssemblyAI'
          };

          // Adicionar informações extras se solicitadas
          if (opcoes.speaker_labels && statusData.utterances) {
            const transcricaoComFalantes = statusData.utterances
              .map(u => `[Falante ${u.speaker}]: ${u.text}`)
              .join('\n\n');
            transcricao = transcricaoComFalantes;
          }

          if (opcoes.sentiment_analysis && statusData.sentiment_analysis_results) {
            metadata.sentimento = statusData.sentiment_analysis_results;
          }

          break;
        } else if (status === 'error') {
          throw new Error(`AssemblyAI erro: ${statusData.error}`);
        }

        tentativas++;
      }

      if (tentativas >= maxTentativas) {
        throw new Error('Timeout: transcrição demorou mais de 5 minutos');
      }

    } else if (servico === 'google') {
      if (!GOOGLE_SPEECH_API_KEY) {
        return Response.json({ 
          error: 'Google Speech API Key não configurada. Configure em Configurações > Transcrição Externa.' 
        }, { status: 400 });
      }

      // Google Speech-to-Text - usar URI ao invés de content para arquivos grandes
      const requestBody = {
        config: {
          encoding: 'WEBM_OPUS', // Formato mais flexível
          languageCode: idioma === 'pt' ? 'pt-BR' : idioma,
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true,
          enableSpeakerDiarization: opcoes.speaker_labels || false,
          diarizationSpeakerCount: opcoes.speaker_count || 2,
        },
        audio: {
          uri: file_url // Usar URI direta ao invés de base64 para evitar timeout
        }
      };

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:longrunningrecognize?key=${GOOGLE_SPEECH_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Speech erro: ${errorData.error?.message || response.statusText}`);
      }

      const operation = await response.json();
      const operationName = operation.name;

      // Polling para verificar conclusão
      let done = false;
      let tentativas = 0;
      const maxTentativas = 60;

      while (!done && tentativas < maxTentativas) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await fetch(
          `https://speech.googleapis.com/v1/operations/${operationName}?key=${GOOGLE_SPEECH_API_KEY}`
        );

        const statusData = await statusResponse.json();
        done = statusData.done;

        if (done) {
          if (statusData.error) {
            throw new Error(`Google Speech erro: ${statusData.error.message}`);
          }

          const results = statusData.response?.results || [];
          const alternatives = results.map(r => r.alternatives?.[0]);
          
          transcricao = alternatives
            .filter(a => a?.transcript)
            .map(a => a.transcript)
            .join(' ');

          const confiancaMedia = alternatives.reduce((sum, a) => sum + (a?.confidence || 0), 0) / alternatives.length;

          metadata = {
            palavras_count: transcricao.split(/\s+/).length,
            confianca: confiancaMedia,
            servico: 'Google Speech-to-Text'
          };

          break;
        }

        tentativas++;
      }

      if (!done) {
        throw new Error('Timeout: transcrição demorou mais de 5 minutos');
      }
    } else {
      return Response.json({ error: 'Serviço não suportado. Use "assemblyai" ou "google"' }, { status: 400 });
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