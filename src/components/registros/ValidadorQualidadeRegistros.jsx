import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ShieldCheck,
  FileCheck,
  MapPin,
  Tag,
  ArrowRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

const tiposDemanda = [
  'Informação', 'Reclamação', 'Solicitação', 'Denúncia', 
  'Sugestão', 'Elogio', 'Conflito', 'Não identificado'
];

export default function ValidadorQualidadeRegistros({ registros }) {
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const queryClient = useQueryClient();

  const comunidadesInvalidas = [
    'Microsoft Teams',
    'null',
    'NULL',
    'Área de travessia sobre o rio/açude',
    'Unidade da empresa',
    'Sede da empresa',
    'Secretaria Municipal de Obras',
    'Escritório',
    'Plataforma digital',
    'Órgão público',
    'Instalação operacional',
    'Sistema',
    'Base administrativa'
  ];

  const higienizarComunidade = (comunidade) => {
    if (!comunidade || comunidade.trim() === '' || comunidade === 'null' || comunidade === 'NULL') {
      return 'Não identificado';
    }
    
    const comunidadeLower = comunidade.toLowerCase().trim();
    for (const invalida of comunidadesInvalidas) {
      if (comunidadeLower.includes(invalida.toLowerCase())) {
        return 'Não identificado';
      }
    }
    
    return comunidade;
  };

  const calcularNotaQualidade = (registro, analise) => {
    let nota = 0;
    let penalidades = [];
    
    // Verificar comunidade (higienizada)
    const comunidadeHigienizada = higienizarComunidade(analise.comunidade || registro.comunidade);
    const houveErroConceitual = comunidadeHigienizada === 'Não identificado' && 
                                 (registro.comunidade && registro.comunidade !== 'Não identificado');
    
    // Município identificado
    if (analise.municipio && analise.municipio !== 'Não identificado') nota += 1;
    
    // Estado identificado
    if (analise.estado && analise.estado !== 'Não identificado') nota += 1;
    
    // Fala/descrição clara
    if (registro.transcricao?.length > 100 || registro.descricao?.length > 100) nota += 1;
    
    // Tipo de demanda identificado
    if (analise.tipo_demanda && analise.tipo_demanda !== 'Não identificado') nota += 1;
    
    // Encaminhamento informado
    if (analise.encaminhamento && analise.encaminhamento !== 'Não identificado') nota += 1;
    
    // Penalizar por erro conceitual de comunidade
    if (houveErroConceitual) {
      nota = Math.max(0, nota - 1);
      penalidades.push('Erro conceitual: comunidade não territorial');
    }
    
    return { nota, penalidades };
  };

  const processarRegistro = async (registro) => {
    const contexto = `
      REGISTRO PARA ANÁLISE:
      
      Título: ${registro.titulo || 'Sem título'}
      Descrição: ${registro.descricao || 'Sem descrição'}
      Transcrição: ${registro.transcricao?.substring(0, 500) || 'Sem transcrição'}
      Comunidade: ${registro.comunidade || 'Não informada'}
      Localização atual: ${JSON.stringify(registro.localizacao || {})}
      Participantes: ${registro.participantes?.join(', ') || 'Não informados'}
      
      TAREFA:
      1. Identifique o MUNICÍPIO mencionado no texto (não invente)
      2. Identifique o ESTADO correspondente ao município
      3. Classifique o TIPO DE DEMANDA: ${tiposDemanda.join(', ')}
      4. Identifique se há ENCAMINHAMENTO (Sim/Não/Não identificado)
      5. Se houver encaminhamento, descreva brevemente
      
      REGRAS:
      - Se não encontrar município no texto, use "Não identificado"
      - Não invente localização
      - Baseie-se APENAS no conteúdo fornecido
      
      Responda APENAS com um JSON válido:
      {
        "municipio": "string",
        "estado": "string",
        "tipo_demanda": "string",
        "encaminhamento": "Sim/Não/Não identificado",
        "descricao_encaminhamento": "string ou null",
        "observacao_tecnica": "string curta ou null"
      }
    `;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contexto,
        response_json_schema: {
          type: "object",
          properties: {
            municipio: { type: "string" },
            estado: { type: "string" },
            tipo_demanda: { type: "string" },
            encaminhamento: { type: "string" },
            descricao_encaminhamento: { type: ["string", "null"] },
            observacao_tecnica: { type: ["string", "null"] }
          },
          required: ["municipio", "estado", "tipo_demanda", "encaminhamento"]
        }
      });

      return response;
    } catch (error) {
      console.error('Erro ao processar registro:', error);
      return {
        municipio: registro.localizacao?.municipio || 'Não identificado',
        estado: registro.localizacao?.estado || 'Não identificado',
        tipo_demanda: 'Não identificado',
        encaminhamento: 'Não identificado',
        descricao_encaminhamento: null,
        observacao_tecnica: 'Erro no processamento'
      };
    }
  };

  const validarRegistros = async () => {
    setProcessando(true);
    setProgresso(0);
    const resultados = [];
    
    for (let i = 0; i < registros.length; i++) {
      const registro = registros[i];
      
      // Processar com IA
      const analise = await processarRegistro(registro);
      
      // Higienizar comunidade
      const comunidadeHigienizada = higienizarComunidade(registro.comunidade);
      
      // Calcular nota de qualidade
      const { nota, penalidades } = calcularNotaQualidade(registro, analise);
      
      // Preparar atualização
      const atualizacao = {
        comunidade: comunidadeHigienizada,
        localizacao: {
          ...registro.localizacao,
          municipio: analise.municipio,
          estado: analise.estado
        },
        tipo_demanda: analise.tipo_demanda,
        encaminhamento_realizado: analise.encaminhamento === 'Sim',
        descricao_encaminhamento: analise.descricao_encaminhamento,
        nota_qualidade: nota,
        validado_em: new Date().toISOString(),
        observacao_validacao: penalidades.length > 0 
          ? `${analise.observacao_tecnica || ''} ${penalidades.join('; ')}`.trim()
          : analise.observacao_tecnica
      };

      // Atualizar registro
      try {
        await base44.entities.Registro.update(registro.id, atualizacao);
        
        resultados.push({
          id: registro.id,
          titulo: registro.titulo,
          antes: {
            comunidade: registro.comunidade || 'NULL',
            municipio: registro.localizacao?.municipio || 'NULL',
            estado: registro.localizacao?.estado || 'NULL',
            tipo_demanda: registro.tipo_demanda || 'NULL'
          },
          depois: {
            comunidade: comunidadeHigienizada,
            municipio: analise.municipio,
            estado: analise.estado,
            tipo_demanda: analise.tipo_demanda
          },
          nota: nota,
          penalidades: penalidades,
          status: 'sucesso'
        });
      } catch (error) {
        resultados.push({
          id: registro.id,
          titulo: registro.titulo,
          status: 'erro',
          erro: error.message
        });
      }
      
      setProgresso(Math.round(((i + 1) / registros.length) * 100));
    }

    setResultado(resultados);
    setProcessando(false);
    
    // Atualizar cache
    queryClient.invalidateQueries({ queryKey: ['registros-voz'] });
    queryClient.invalidateQueries({ queryKey: ['registros'] });
  };

  const getNotaColor = (nota) => {
    if (nota >= 4) return 'text-emerald-600 bg-emerald-50';
    if (nota >= 3) return 'text-blue-600 bg-blue-50';
    if (nota >= 2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getNotaLabel = (nota) => {
    if (nota === 5) return 'Completo';
    if (nota >= 4) return 'Bom';
    if (nota >= 3) return 'Utilizável';
    if (nota >= 2) return 'Frágil';
    return 'Crítico';
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          Validador de Qualidade de Registros
        </CardTitle>
        <p className="text-sm text-slate-600">
          Correção automática de inconsistências e atribuição de nota de qualidade
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!processando && !resultado && (
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-900 font-medium mb-2">O que será validado:</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>✓ Comunidade (remover valores inválidos: Microsoft Teams, null, sistemas, órgãos)</li>
                <li>✓ Município e Estado (corrigir NULL/vazios)</li>
                <li>✓ Tipo de Demanda (classificar automaticamente)</li>
                <li>✓ Encaminhamentos (identificar se houve)</li>
                <li>✓ Nota de Qualidade (0-5 com penalização por erros conceituais)</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Registros a processar:</p>
                <p className="text-2xl font-bold text-purple-600">{registros.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-purple-300" />
            </div>

            <Button 
              onClick={validarRegistros}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Iniciar Validação
            </Button>
          </div>
        )}

        {processando && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-600" />
              <p className="text-sm font-medium">Processando registros...</p>
              <p className="text-xs text-slate-500">Isso pode levar alguns minutos</p>
            </div>
            <Progress value={progresso} className="h-2" />
            <p className="text-center text-sm text-slate-600">{progresso}%</p>
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-lg text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                <p className="text-xs text-slate-600">Sucesso</p>
                <p className="text-lg font-bold text-emerald-600">
                  {resultado.filter(r => r.status === 'sucesso').length}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <XCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                <p className="text-xs text-slate-600">Erros</p>
                <p className="text-lg font-bold text-red-600">
                  {resultado.filter(r => r.status === 'erro').length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <FileCheck className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-slate-600">Total</p>
                <p className="text-lg font-bold text-blue-600">{resultado.length}</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {resultado.map((r, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{r.titulo}</p>
                    {r.status === 'sucesso' && (
                      <Badge className={cn("text-xs", getNotaColor(r.nota))}>
                        {r.nota}/5 - {getNotaLabel(r.nota)}
                      </Badge>
                    )}
                  </div>
                  
                  {r.status === 'sucesso' ? (
                    <div className="space-y-1 text-slate-600">
                      {r.antes.comunidade !== r.depois.comunidade && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span className="line-through text-red-500">{r.antes.comunidade}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium text-purple-600">{r.depois.comunidade}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{r.antes.municipio}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-purple-600">{r.depois.municipio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        <span>{r.antes.tipo_demanda}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-purple-600">{r.depois.tipo_demanda}</span>
                      </div>
                      {r.penalidades && r.penalidades.length > 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                          ⚠️ {r.penalidades.join('; ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-600">Erro: {r.erro}</p>
                  )}
                </div>
              ))}
            </div>

            <Button 
              onClick={() => {
                setResultado(null);
                setProgresso(0);
              }}
              variant="outline"
              className="w-full"
            >
              Nova Validação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}