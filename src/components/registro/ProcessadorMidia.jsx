import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function ProcessadorMidia({ arquivo, tipo, onTextoExtraido, onErro }) {
  const [status, setStatus] = useState('processando');
  const [progresso, setProgresso] = useState(0);
  const [tentativas, setTentativas] = useState(0);
  const [textoExtraido, setTextoExtraido] = useState('');

  React.useEffect(() => {
    processar();
  }, []);

  const processar = async () => {
    setStatus('processando');
    setProgresso(10);
    
    try {
      // Upload
      setProgresso(30);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: arquivo });
      
      // Extração baseada no tipo
      setProgresso(50);
      let promptExtracao = '';
      
      switch(tipo) {
        case 'audio':
          promptExtracao = 'Transcreva INTEGRALMENTE este áudio. Retorne apenas a transcrição completa sem resumos.';
          break;
        case 'video':
          promptExtracao = 'Extraia o áudio deste vídeo e transcreva INTEGRALMENTE. Retorne apenas a transcrição.';
          break;
        case 'foto':
          promptExtracao = 'Extraia TODO o texto visível nesta imagem (OCR). Se não houver texto, descreva o conteúdo visual relevante.';
          break;
        case 'documento':
          promptExtracao = 'Extraia TODO o texto deste documento preservando estrutura (títulos, parágrafos, listas). Não resuma.';
          break;
        default:
          promptExtracao = 'Extraia TODO o conteúdo textual deste arquivo.';
      }

      setProgresso(70);
      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: promptExtracao,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            texto_extraido: { type: "string" },
            tipo_conteudo: { type: "string" },
            qualidade: { type: "string" }
          }
        }
      });

      setProgresso(90);
      
      if (!resultado.texto_extraido || resultado.texto_extraido.trim().length < 10) {
        throw new Error('Texto extraído insuficiente ou vazio');
      }

      setTextoExtraido(resultado.texto_extraido);
      setProgresso(100);
      setStatus('sucesso');
      
      onTextoExtraido({
        texto: resultado.texto_extraido,
        arquivo: arquivo.name,
        tipo,
        qualidade: resultado.qualidade
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      setStatus('erro');
      setProgresso(0);
      onErro({
        arquivo: arquivo.name,
        tipo,
        erro: error.message,
        tentativa: tentativas + 1
      });
    }
  };

  const retentar = () => {
    if (tentativas < 3) {
      setTentativas(prev => prev + 1);
      processar();
    }
  };

  return (
    <Card className={`border-2 ${
      status === 'sucesso' ? 'border-green-500 bg-green-50' : 
      status === 'erro' ? 'border-red-500 bg-red-50' : 
      'border-blue-500'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {status === 'processando' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'sucesso' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {status === 'erro' && <XCircle className="w-4 h-4 text-red-600" />}
          {arquivo.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{tipo}</Badge>
          <Badge className={
            status === 'sucesso' ? 'bg-green-600' : 
            status === 'erro' ? 'bg-red-600' : 
            'bg-blue-600'
          }>
            {status}
          </Badge>
        </div>

        {status === 'processando' && (
          <Progress value={progresso} className="h-2" />
        )}

        {status === 'erro' && (
          <div className="space-y-2">
            <p className="text-xs text-red-700">Falha na extração de texto</p>
            {tentativas < 3 && (
              <Button size="sm" variant="outline" onClick={retentar} className="w-full">
                <RefreshCw className="w-3 h-3 mr-2" />
                Reprocessar (tentativa {tentativas + 1}/3)
              </Button>
            )}
          </div>
        )}

        {status === 'sucesso' && textoExtraido && (
          <p className="text-xs text-green-700">
            ✓ {textoExtraido.length} caracteres extraídos
          </p>
        )}
      </CardContent>
    </Card>
  );
}