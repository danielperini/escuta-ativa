import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, Sparkles, TrendingUp, Plus } from 'lucide-react';

export default function SugestoesIARegistro({ 
  textoConsolidado, 
  comunidades, 
  onAplicarSugestao,
  formData 
}) {
  const [sugestoes, setSugestoes] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (textoConsolidado && textoConsolidado.length >= 100) {
      const timer = setTimeout(() => {
        gerarSugestoes();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [textoConsolidado]);

  const gerarSugestoes = async () => {
    setCarregando(true);
    try {
      // Buscar contexto similar
      const [registrosRecentes, stakeholdersRecentes] = await Promise.all([
        base44.entities.Registro.list('-created_date', 20),
        base44.entities.Stakeholder.list('-created_date', 50)
      ]);

      const contextoSimilar = registrosRecentes
        .filter(r => r.titulo && r.descricao)
        .slice(0, 5)
        .map(r => ({
          titulo: r.titulo,
          tipo: r.tipo,
          temas: r.temas_identificados,
          comunidade: r.comunidade
        }));

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este texto de registro e forneça sugestões inteligentes baseadas em registros similares:

TEXTO ATUAL:
${textoConsolidado}

CONTEXTO DE REGISTROS SIMILARES RECENTES:
${JSON.stringify(contextoSimilar, null, 2)}

STAKEHOLDERS DISPONÍVEIS:
${stakeholdersRecentes.slice(0, 30).map(s => `${s.nome} (${s.comunidade || 'sem comunidade'})`).join(', ')}

COMUNIDADES EXISTENTES:
${comunidades.map(c => c.nome).join(', ')}

Forneça sugestões detalhadas:
1. Três opções de título (curto, direto, descritivo)
2. Descrição otimizada e bem estruturada
3. Tags/temas relevantes (até 6 temas)
4. Nomes de stakeholders mencionados (use EXATAMENTE os nomes da lista acima)
5. Comunidade detectada (use EXATAMENTE um nome da lista acima)
6. Resumo executivo em 2-3 linhas
7. Tipo de registro mais adequado
8. Sentimento predominante (positivo, neutro, negativo, misto)`,
        response_json_schema: {
          type: "object",
          properties: {
            titulos_sugeridos: { 
              type: "array", 
              items: { type: "string" }, 
              minItems: 3,
              maxItems: 3 
            },
            descricao_otimizada: { type: "string" },
            temas_sugeridos: { 
              type: "array", 
              items: { type: "string" },
              maxItems: 6
            },
            stakeholders_mencionados: { 
              type: "array", 
              items: { type: "string" } 
            },
            comunidade_detectada: { type: "string" },
            resumo_executivo: { type: "string" },
            tipo_sugerido: { 
              type: "string",
              enum: ["reuniao", "conversa_campo", "visita", "demanda", "ocorrencia"]
            },
            sentimento_sugerido: { 
              type: "string",
              enum: ["positivo", "neutro", "negativo", "misto"]
            }
          }
        }
      });

      // Mapear stakeholders para objetos completos
      const stakeholdersEncontrados = resultado.stakeholders_mencionados?.map(nome => {
        return stakeholdersRecentes.find(s => 
          s.nome.toLowerCase().trim() === nome.toLowerCase().trim() ||
          s.nome.toLowerCase().includes(nome.toLowerCase()) ||
          nome.toLowerCase().includes(s.nome.toLowerCase())
        );
      }).filter(Boolean) || [];

      setSugestoes({
        ...resultado,
        stakeholders_encontrados: stakeholdersEncontrados
      });

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setCarregando(false);
    }
  };

  if (!textoConsolidado || textoConsolidado.length < 100) {
    return null;
  }

  if (carregando) {
    return (
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 text-sm text-purple-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analisando e gerando sugestões inteligentes...
        </div>
      </Card>
    );
  }

  if (!sugestoes) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-purple-600" />
        <h4 className="font-semibold text-purple-900">Sugestões Inteligentes da IA</h4>
      </div>

      {/* Títulos Sugeridos */}
      {sugestoes.titulos_sugeridos?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-purple-700 mb-2">📝 Opções de título:</p>
          <div className="space-y-2">
            {sugestoes.titulos_sugeridos.map((titulo, idx) => (
              <Button
                key={idx}
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start text-left text-xs h-auto py-2 px-3 bg-white hover:bg-purple-50"
                onClick={() => onAplicarSugestao('titulo', titulo)}
              >
                <Sparkles className="w-3 h-3 mr-2 flex-shrink-0 text-purple-600" />
                <span className="line-clamp-2">{titulo}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Resumo Executivo */}
      {sugestoes.resumo_executivo && (
        <div className="mb-4 p-3 bg-white/70 rounded-lg">
          <p className="text-xs font-medium text-purple-700 mb-1">📋 Resumo executivo:</p>
          <p className="text-xs text-slate-700 leading-relaxed">{sugestoes.resumo_executivo}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-purple-600 mt-2 h-auto py-1"
            onClick={() => onAplicarSugestao('resumo_automatico', sugestoes.resumo_executivo)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Usar este resumo
          </Button>
        </div>
      )}

      {/* Descrição Otimizada */}
      {sugestoes.descricao_otimizada && formData.descricao !== sugestoes.descricao_otimizada && (
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs w-full bg-white hover:bg-purple-50"
            onClick={() => onAplicarSugestao('descricao', sugestoes.descricao_otimizada)}
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Aplicar descrição otimizada pela IA
          </Button>
        </div>
      )}

      {/* Temas Sugeridos */}
      {sugestoes.temas_sugeridos?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-purple-700 mb-2">🏷️ Temas detectados:</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.temas_sugeridos.map((tema, idx) => {
              const jaAdicionado = formData.temas_identificados?.includes(tema);
              return (
                <Button
                  key={idx}
                  type="button"
                  variant={jaAdicionado ? "secondary" : "outline"}
                  size="sm"
                  className="text-xs h-7 bg-white"
                  disabled={jaAdicionado}
                  onClick={() => {
                    if (!jaAdicionado) {
                      onAplicarSugestao('temas_identificados', 
                        [...(formData.temas_identificados || []), tema]
                      );
                    }
                  }}
                >
                  {jaAdicionado ? '✓' : <Plus className="w-3 h-3 mr-1" />}
                  {tema}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stakeholders Detectados */}
      {sugestoes.stakeholders_encontrados?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-purple-700 mb-2">👥 Stakeholders mencionados:</p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.stakeholders_encontrados.map(s => (
              <Badge key={s.id} variant="secondary" className="text-xs bg-white">
                {s.nome}
                {s.comunidade && <span className="text-slate-500 ml-1">• {s.comunidade}</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Comunidade e Tipo */}
      <div className="grid grid-cols-2 gap-3">
        {sugestoes.comunidade_detectada && formData.comunidade !== sugestoes.comunidade_detectada && (
          <div>
            <p className="text-xs text-purple-700 mb-1">📍 Comunidade:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs w-full bg-white hover:bg-purple-50 justify-start"
              onClick={() => onAplicarSugestao('comunidade', sugestoes.comunidade_detectada)}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {sugestoes.comunidade_detectada}
            </Button>
          </div>
        )}

        {sugestoes.tipo_sugerido && formData.tipo !== sugestoes.tipo_sugerido && (
          <div>
            <p className="text-xs text-purple-700 mb-1">📑 Tipo:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs w-full bg-white hover:bg-purple-50 justify-start capitalize"
              onClick={() => onAplicarSugestao('tipo', sugestoes.tipo_sugerido)}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {sugestoes.tipo_sugerido.replace('_', ' ')}
            </Button>
          </div>
        )}
      </div>

      {sugestoes.sentimento_sugerido && (
        <div className="mt-3 text-xs text-center text-purple-600">
          💬 Sentimento detectado: <strong className="capitalize">{sugestoes.sentimento_sugerido}</strong>
        </div>
      )}
    </Card>
  );
}