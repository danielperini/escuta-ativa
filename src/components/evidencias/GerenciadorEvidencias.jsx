import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileText, Image, Video, Mic, File, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { gerarCodigoUnico } from '@/components/codigos/GeradorCodigoUnico';
import ProcessadorAudioUniversal from '@/components/registro/ProcessadorAudioUniversal';

const TIPOS_ARQUIVO = {
  imagem: { icon: Image, color: 'text-blue-600', formatos: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'] },
  video: { icon: Video, color: 'text-purple-600', formatos: ['video/mp4', 'video/quicktime', 'video/webm'] },
  audio: { icon: Mic, color: 'text-emerald-600', formatos: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a'] },
  documento: { icon: FileText, color: 'text-amber-600', formatos: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }
};

export default function GerenciadorEvidencias({ 
  tipo = 'registro', // 'registro' ou 'caso'
  entidadeId,
  comunidade,
  evidenciasExistentes = [],
  onEvidenciaAdicionada
}) {
  const [arquivos, setArquivos] = useState([]);
  const [descricoes, setDescricoes] = useState({});
  const [uploading, setUploading] = useState(false);
  const [mostrarAudio, setMostrarAudio] = useState(false);

  const detectarTipoArquivo = (file) => {
    for (const [tipo, config] of Object.entries(TIPOS_ARQUIVO)) {
      if (config.formatos.some(f => file.type.includes(f.split('/')[1]))) {
        return tipo;
      }
    }
    return 'documento';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const novosArquivos = files.map(file => ({
      file,
      tipo: detectarTipoArquivo(file),
      id: Math.random().toString(36).substr(2, 9),
      nome: file.name
    }));
    
    setArquivos(prev => [...prev, ...novosArquivos]);
  };

  const removerArquivo = (id) => {
    setArquivos(prev => prev.filter(a => a.id !== id));
    setDescricoes(prev => {
      const novo = { ...prev };
      delete novo[id];
      return novo;
    });
  };

  const uploadEvidencias = async () => {
    if (arquivos.length === 0) {
      toast.error('Adicione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    const evidenciasProcessadas = [];

    try {
      for (const arquivo of arquivos) {
        // Upload do arquivo
        const { file_url } = await base44.integrations.Core.UploadFile({ 
          file: arquivo.file 
        });

        // Gerar código DOC para o arquivo
        const codigoDoc = await gerarCodigoUnico('DOC', comunidade);

        // Processar transcrição se for áudio
        let transcricao = null;
        if (arquivo.tipo === 'audio') {
          try {
            const prompt = `Transcreva este áudio em português brasileiro de forma precisa. Retorne apenas a transcrição.`;
            transcricao = await base44.integrations.Core.InvokeLLM({
              prompt,
              file_urls: [file_url]
            });
          } catch (error) {
            console.error('Erro ao transcrever áudio:', error);
          }
        }

        evidenciasProcessadas.push({
          url: file_url,
          tipo: arquivo.tipo,
          nome: arquivo.nome,
          descricao: descricoes[arquivo.id] || '',
          codigo_documento: codigoDoc,
          transcricao,
          data: new Date().toISOString()
        });
      }

      // Atualizar entidade com novas evidências
      if (tipo === 'registro' && entidadeId) {
        const registros = await base44.entities.Registro.filter({ id: entidadeId });
        if (registros.length > 0) {
          const registro = registros[0];
          const arquivosAtualizados = [...(registro.arquivos || []), ...evidenciasProcessadas];
          await base44.entities.Registro.update(entidadeId, {
            arquivos: arquivosAtualizados
          });
        }
      } else if (tipo === 'caso' && entidadeId) {
        const casos = await base44.entities.Caso.filter({ id: entidadeId });
        if (casos.length > 0) {
          const caso = casos[0];
          const evidenciasAtualizadas = [...(caso.evidencias || []), ...evidenciasProcessadas];
          await base44.entities.Caso.update(entidadeId, {
            evidencias: evidenciasAtualizadas
          });
        }
      }

      toast.success(`${evidenciasProcessadas.length} evidência(s) adicionada(s) com sucesso!`);
      setArquivos([]);
      setDescricoes({});
      
      if (onEvidenciaAdicionada) {
        onEvidenciaAdicionada(evidenciasProcessadas);
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao adicionar evidências');
    } finally {
      setUploading(false);
    }
  };

  const handleAudioTranscrito = async (transcricao, fileUrl) => {
    // Criar um "arquivo" virtual para o áudio transcrito
    const codigoDoc = await gerarCodigoUnico('DOC', comunidade);
    const evidencia = {
      url: fileUrl,
      tipo: 'audio',
      nome: 'Audio transcrito',
      descricao: 'Áudio processado com transcrição automática',
      codigo_documento: codigoDoc,
      transcricao,
      data: new Date().toISOString()
    };

    if (tipo === 'registro' && entidadeId) {
      const registros = await base44.entities.Registro.filter({ id: entidadeId });
      if (registros.length > 0) {
        const registro = registros[0];
        const arquivosAtualizados = [...(registro.arquivos || []), evidencia];
        await base44.entities.Registro.update(entidadeId, {
          arquivos: arquivosAtualizados
        });
      }
    } else if (tipo === 'caso' && entidadeId) {
      const casos = await base44.entities.Caso.filter({ id: entidadeId });
      if (casos.length > 0) {
        const caso = casos[0];
        const evidenciasAtualizadas = [...(caso.evidencias || []), evidencia];
        await base44.entities.Caso.update(entidadeId, {
          evidencias: evidenciasAtualizadas
        });
      }
    }

    toast.success('Áudio transcrito e vinculado como evidência');
    setMostrarAudio(false);
    
    if (onEvidenciaAdicionada) {
      onEvidenciaAdicionada([evidencia]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Evidências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
            <Button
              variant="outline"
              onClick={() => setMostrarAudio(!mostrarAudio)}
              disabled={uploading}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            ✓ Imagens, vídeos, áudios (MP3, WAV, OGG, WhatsApp), PDFs e documentos
          </p>

          {mostrarAudio && (
            <ProcessadorAudioUniversal 
              onTranscricaoCompleta={handleAudioTranscrito}
            />
          )}

          {arquivos.length > 0 && (
            <div className="space-y-2">
              {arquivos.map(arquivo => {
                const TipoIcon = TIPOS_ARQUIVO[arquivo.tipo].icon;
                return (
                  <div key={arquivo.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TipoIcon className={`w-5 h-5 ${TIPOS_ARQUIVO[arquivo.tipo].color}`} />
                        <div>
                          <p className="text-sm font-medium">{arquivo.nome}</p>
                          <Badge variant="secondary" className="mt-1">
                            {arquivo.tipo}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerArquivo(arquivo.id)}
                        disabled={uploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Descrição da evidência (opcional)"
                      value={descricoes[arquivo.id] || ''}
                      onChange={(e) => setDescricoes(prev => ({
                        ...prev,
                        [arquivo.id]: e.target.value
                      }))}
                      disabled={uploading}
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {arquivos.length > 0 && (
            <Button 
              onClick={uploadEvidencias}
              disabled={uploading}
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando {arquivos.length} arquivo(s)...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar {arquivos.length} Evidência(s)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {evidenciasExistentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evidências Vinculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evidenciasExistentes.map((ev, idx) => {
                const TipoIcon = TIPOS_ARQUIVO[ev.tipo]?.icon || File;
                return (
                  <a
                    key={idx}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <TipoIcon className={`w-5 h-5 ${TIPOS_ARQUIVO[ev.tipo]?.color || 'text-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ev.nome}</p>
                        {ev.codigo_documento && (
                          <p className="text-xs font-mono text-slate-500">{ev.codigo_documento}</p>
                        )}
                        {ev.descricao && (
                          <p className="text-xs text-slate-600 mt-1">{ev.descricao}</p>
                        )}
                        {ev.transcricao && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Transcrito em PT-BR
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}