import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, AlertTriangle, Check } from 'lucide-react';

/**
 * Detecta automaticamente se deve abrir CASOS
 * Baseado em devolutivas pendentes, demandas, pendências históricas
 */
export default function DetectorCasosAutomatico({ 
  textoConsolidado, 
  demandasExtraidas, 
  comunidade, 
  municipio,
  stakeholdersVinculados,
  registroId,
  onCasosCriados 
}) {
  const [detectando, setDetectando] = useState(true);
  const [casosDetectados, setCasosDetectados] = useState([]);
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    detectarCasos();
  }, []);

  const detectarCasos = async () => {
    try {
      const demandasTexto = demandasExtraidas?.map(d => 
        `- ${d.descricao} (urgência: ${d.urgencia})`
      ).join('\n') || 'Nenhuma demanda identificada';

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o registro e determine se casos devem ser abertos.

TEXTO DO REGISTRO:
${textoConsolidado}

DEMANDAS IDENTIFICADAS:
${demandasTexto}

CONTEXTO:
- Comunidade: ${comunidade}
- Município: ${municipio}
- Stakeholders envolvidos: ${stakeholdersVinculados?.length || 0}

CRITÉRIOS PARA ABERTURA DE CASO:
1. Empresa precisa dar devolutiva
2. Demanda individual ou coletiva pendente
3. Pendência de resposta, entrega ou ação
4. Histórico não resolvido (indenização, serviço, apoio, infraestrutura)
5. Compromisso assumido anteriormente não cumprido
6. Situação que exige acompanhamento

Para cada caso que deve ser aberto:
- Título claro
- Tipo (devolutiva, demanda_individual, demanda_coletiva, indenizacao, servico, apoio, infraestrutura, outro)
- Descrição
- Tema principal
- Prioridade (baixa, media, alta, urgente)
- Prazo sugerido (em dias, padrão 15)
- Impacto na comunidade (baixo, medio, alto, critico)
- Justificativa da abertura`,
        response_json_schema: {
          type: "object",
          properties: {
            casos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  tipo: { 
                    type: "string", 
                    enum: ["devolutiva", "demanda_individual", "demanda_coletiva", "indenizacao", "servico", "apoio", "infraestrutura", "outro"] 
                  },
                  descricao: { type: "string" },
                  tema: { type: "string" },
                  prioridade: { type: "string", enum: ["baixa", "media", "alta", "urgente"] },
                  prazo_dias: { type: "number" },
                  impacto_comunidade: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
                  justificativa: { type: "string" }
                }
              }
            }
          }
        }
      });

      setCasosDetectados(resultado.casos || []);

      // Auto-selecionar casos de alta prioridade ou impacto crítico
      const autoSelecionados = (resultado.casos || [])
        .map((caso, idx) => ({ caso, idx }))
        .filter(({ caso }) => 
          caso.prioridade === 'urgente' || 
          caso.prioridade === 'alta' ||
          caso.impacto_comunidade === 'critico'
        )
        .map(({ idx }) => idx);

      setSelecionados(autoSelecionados);

    } catch (error) {
      console.error('Erro ao detectar casos:', error);
    } finally {
      setDetectando(false);
    }
  };

  const toggleSelecao = (index) => {
    setSelecionados(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const confirmarAberturaCasos = async () => {
    const casosCriados = [];

    for (const index of selecionados) {
      const caso = casosDetectados[index];

      const prazo = new Date();
      prazo.setDate(prazo.getDate() + (caso.prazo_dias || 15));

      const novoCaso = await base44.entities.Caso.create({
        titulo: caso.titulo,
        descricao: caso.descricao,
        tipo: caso.tipo,
        stakeholders_envolvidos: stakeholdersVinculados || [],
        comunidade,
        municipio: municipio || 'A definir',
        tema: caso.tema,
        registro_origem_id: registroId,
        status: 'em_aberto',
        prioridade: caso.prioridade,
        prazo: prazo.toISOString().split('T')[0],
        impacto_comunidade: caso.impacto_comunidade,
        data_abertura: new Date().toISOString(),
        historico_atualizacoes: [{
          data: new Date().toISOString(),
          usuario: 'Sistema IA',
          acao: 'Abertura automática',
          observacao: caso.justificativa
        }]
      });

      casosCriados.push(novoCaso.id);
    }

    if (onCasosCriados) {
      onCasosCriados(casosCriados);
    }
  };

  const getPrioridadeColor = (prioridade) => {
    if (prioridade === 'urgente') return 'bg-red-100 text-red-700';
    if (prioridade === 'alta') return 'bg-orange-100 text-orange-700';
    if (prioridade === 'media') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const getImpactoColor = (impacto) => {
    if (impacto === 'critico') return 'text-red-600';
    if (impacto === 'alto') return 'text-orange-600';
    if (impacto === 'medio') return 'text-amber-600';
    return 'text-slate-500';
  };

  if (detectando) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="font-medium text-slate-700">Analisando Casos...</p>
          <p className="text-sm text-slate-500 mt-1">Verificando se devolutivas ou pendências exigem abertura de casos</p>
        </CardContent>
      </Card>
    );
  }

  if (casosDetectados.length === 0) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="py-8 text-center">
          <Check className="w-12 h-12 mx-auto mb-3 text-emerald-600" />
          <p className="font-medium text-emerald-900">Nenhum caso requer abertura</p>
          <p className="text-sm text-emerald-700 mt-1">Este registro não identifica pendências que exigem acompanhamento</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-900 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {casosDetectados.length} Caso{casosDetectados.length !== 1 && 's'} detectado{casosDetectados.length !== 1 && 's'}
        </p>
        <p className="text-xs text-amber-700 mt-1">
          Situações que exigem devolutiva ou acompanhamento da empresa
        </p>
      </div>

      <div className="space-y-2">
        {casosDetectados.map((caso, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selecionados.includes(index)
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => toggleSelecao(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900">{caso.titulo}</h4>
                    <Badge className={`text-xs ${getPrioridadeColor(caso.prioridade)}`}>
                      {caso.prioridade}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {caso.tipo.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-700 mb-2">{caso.descricao}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>📋 Tema: {caso.tema}</span>
                    <span className={`flex items-center gap-1 font-medium ${getImpactoColor(caso.impacto_comunidade)}`}>
                      <AlertTriangle className="w-3 h-3" />
                      Impacto {caso.impacto_comunidade}
                    </span>
                    <span>⏰ {caso.prazo_dias || 15} dias</span>
                  </div>

                  <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded">
                    💡 {caso.justificativa}
                  </p>
                </div>

                {selecionados.includes(index) && (
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={confirmarAberturaCasos}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <Briefcase className="w-5 h-5 mr-2" />
        Abrir {selecionados.length} Caso{selecionados.length !== 1 && 's'}
      </Button>
    </div>
  );
}