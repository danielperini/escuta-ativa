import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Loader2, 
  CheckCircle, 
  Sparkles,
  FileAudio,
  FileVideo,
  FileImage,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function AnalisadorMidia({ arquivo, onAnaliseCompleta }) {
  const [etapa, setEtapa] = useState('preparando'); // preparando, transcrevendo, analisando, concluido, erro
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  const etapasConfig = {
    preparando: { label: 'Preparando arquivo...', icon: Loader2, color: 'text-blue-500' },
    transcrevendo: { label: 'Transcrevendo conteúdo...', icon: FileAudio, color: 'text-purple-500' },
    analisando: { label: 'Analisando com IA...', icon: Sparkles, color: 'text-amber-500' },
    concluido: { label: 'Análise concluída!', icon: CheckCircle, color: 'text-emerald-500' },
    erro: { label: 'Erro na análise', icon: AlertCircle, color: 'text-red-500' }
  };

  React.useEffect(() => {
    if (arquivo) {
      analisarArquivo();
    }
  }, [arquivo]);

  const analisarArquivo = async () => {
    try {
      setEtapa('preparando');
      setProgresso(10);

      // Step 1: Extract content from file
      setEtapa('transcrevendo');
      setProgresso(30);

      const jsonSchema = {
        type: "object",
        properties: {
          transcricao: { type: "string" },
          texto_extraido: { type: "string" },
          conteudo_principal: { type: "string" }
        }
      };

      let conteudoExtraido;
      
      if (arquivo.tipo === 'audio' || arquivo.tipo === 'video') {
        // Para áudio e vídeo, usar transcrição via LLM com contexto
        const promptTranscricao = `Você está processando um ${arquivo.tipo} de uma interação comunitária. 
Extraia TODO o conteúdo falado e retorne como transcrição completa.`;
        
        conteudoExtraido = await base44.integrations.Core.InvokeLLM({
          prompt: promptTranscricao,
          file_urls: [arquivo.url],
          response_json_schema: jsonSchema
        });
      } else if (arquivo.tipo === 'foto' || arquivo.tipo === 'documento') {
        // Para documentos e fotos, usar OCR via ExtractData
        const schemaOCR = {
          type: "object",
          properties: {
            texto_extraido: { type: "string" },
            tipo_documento: { type: "string" },
            informacoes_visiveis: { type: "array", items: { type: "string" } }
          }
        };

        const resultOCR = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: arquivo.url,
          json_schema: schemaOCR
        });

        if (resultOCR.status === 'success') {
          conteudoExtraido = { texto_extraido: resultOCR.output.texto_extraido };
        } else {
          throw new Error(resultOCR.details || 'Erro ao extrair dados do arquivo');
        }
      }

      setProgresso(60);

      // Step 2: Analyze with AI
      setEtapa('analisando');

      const promptAnalise = `Analise o seguinte conteúdo de uma interação comunitária e extraia TODAS as informações estruturadas possíveis:

CONTEÚDO:
${conteudoExtraido.transcricao || conteudoExtraido.texto_extraido || conteudoExtraido.conteudo_principal || ''}

Extraia e estruture:

1. TÍTULO SUGERIDO para o registro (seja específico e descritivo)
2. TIPO de interação (reuniao, conversa_campo, ocorrencia, demanda, ou visita)
3. PARTICIPANTES mencionados (nomes completos quando possível)
4. COMUNIDADE/LOCAL mencionado
5. DATA mencionada (se houver)
6. TEMAS/PAUTAS principais discutidos
7. DEMANDAS DA COMUNIDADE (liste cada uma com descrição e urgência: baixa, media, alta, critica)
8. COMPROMISSOS ASSUMIDOS (descrição, responsável mencionado, prazo se houver)
9. PRÓXIMOS PASSOS mencionados
10. SENTIMENTO GERAL (positivo, neutro, negativo, misto)
11. TEMPERATURA DO TERRITÓRIO (baixo, medio, alto, critico)
12. INDICADORES DE RISCO SOCIAL identificados
13. RESUMO AUTOMÁTICO (2-3 parágrafos)
14. INSIGHTS e observações importantes

Seja detalhado e preciso. Se alguma informação não estiver presente, indique como null.`;

      const analiseIA = await base44.integrations.Core.InvokeLLM({
        prompt: promptAnalise,
        response_json_schema: {
          type: "object",
          properties: {
            titulo_sugerido: { type: "string" },
            tipo_sugerido: { type: "string" },
            participantes: { type: "array", items: { type: "string" } },
            comunidade: { type: "string" },
            data_mencionada: { type: "string" },
            temas: { type: "array", items: { type: "string" } },
            demandas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  urgencia: { type: "string" }
                }
              }
            },
            compromissos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  descricao: { type: "string" },
                  responsavel: { type: "string" },
                  prazo: { type: "string" }
                }
              }
            },
            proximos_passos: { type: "array", items: { type: "string" } },
            sentimento: { type: "string" },
            temperatura_territorio: { type: "string" },
            indicadores_risco: { type: "array", items: { type: "string" } },
            resumo_automatico: { type: "string" },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setProgresso(90);

      // Prepare result
      const resultadoFinal = {
        transcricao: conteudoExtraido.transcricao || conteudoExtraido.texto_extraido || '',
        analise: analiseIA,
        origem: arquivo.tipo,
        arquivo_original: arquivo.url,
        confianca: 0.85, // Could be calculated based on AI confidence
        camposPreenchidos: Object.keys(analiseIA).filter(k => analiseIA[k] !== null && analiseIA[k] !== '')
      };

      setResultado(resultadoFinal);
      setEtapa('concluido');
      setProgresso(100);

      // Notify parent component
      if (onAnaliseCompleta) {
        onAnaliseCompleta(resultadoFinal);
      }

    } catch (error) {
      console.error('Erro na análise:', error);
      setErro(error.message);
      setEtapa('erro');
    }
  };

  const etapaAtual = etapasConfig[etapa];
  const IconeEtapa = etapaAtual.icon;

  return (
    <Card className="border-2 border-[#40916C]/20 bg-gradient-to-br from-[#D8F3DC]/30 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#40916C]" />
          Análise Inteligente de Mídia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-white shadow-sm",
            etapa !== 'erro' && etapa !== 'concluido' && "animate-pulse"
          )}>
            <IconeEtapa className={cn("w-5 h-5", etapaAtual.color, etapa === 'analisando' && "animate-spin")} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-700">{etapaAtual.label}</p>
            <p className="text-sm text-slate-500">{arquivo.nome}</p>
          </div>
        </div>

        {/* Progress bar */}
        {etapa !== 'erro' && etapa !== 'concluido' && (
          <Progress value={progresso} className="h-2" />
        )}

        {/* Erro */}
        {etapa === 'erro' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        {/* Resultado */}
        {etapa === 'concluido' && resultado && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">
                {resultado.camposPreenchidos.length} campos preenchidos automaticamente
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {resultado.camposPreenchidos.slice(0, 6).map((campo, idx) => (
                <Badge key={idx} variant="secondary" className="bg-[#40916C]/10 text-[#2D6A4F] justify-center">
                  {campo.replace(/_/g, ' ')}
                </Badge>
              ))}
              {resultado.camposPreenchidos.length > 6 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 justify-center">
                  +{resultado.camposPreenchidos.length - 6} mais
                </Badge>
              )}
            </div>

            {resultado.analise.resumo_automatico && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">Resumo</p>
                <p className="text-sm text-slate-700 line-clamp-3">
                  {resultado.analise.resumo_automatico}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}