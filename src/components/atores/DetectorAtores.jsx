import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Sparkles, Users, Check, X, Loader2, Plus } from 'lucide-react';

export default function DetectorAtores({ registro, onAtoresVinculados }) {
  const [detectando, setDetectando] = useState(false);
  const [atoresDetectados, setAtoresDetectados] = useState([]);
  const [atoresSelecionados, setAtoresSelecionados] = useState([]);

  useEffect(() => {
    if (registro) {
      detectarAtores();
    }
  }, [registro]);

  const detectarAtores = async () => {
    setDetectando(true);
    try {
      const [atoresExistentes, liderancas, organizacoes] = await Promise.all([
        base44.entities.Ator.list(),
        base44.entities.LiderancaComunitaria.list(),
        base44.entities.ProjetoOrganizacao.list()
      ]);

      const prompt = `Você é um sistema especializado em identificação de ATORES SOCIAIS em registros comunitários.

REGISTRO COMPLETO:
═══════════════
Título: ${registro.titulo}
Comunidade: ${registro.comunidade}
Local: ${registro.local}
Descrição: ${registro.descricao}
Participantes listados: ${registro.participantes?.join(', ') || 'não especificado'}
Transcrição completa: ${registro.transcricao || ''}
═══════════════

ATORES JÁ CADASTRADOS NO SISTEMA (para referência de duplicatas):
Atores: ${JSON.stringify(atoresExistentes.map(a => ({ id: a.id, nome: a.nome, tipo: a.tipo })).slice(0, 30), null, 2)}
Lideranças: ${JSON.stringify(liderancas.map(l => ({ id: l.id, nome: l.nome })).slice(0, 30), null, 2)}
Organizações: ${JSON.stringify(organizacoes.map(o => ({ id: o.id, nome_oficial: o.nome_oficial })).slice(0, 30), null, 2)}

TAREFA: Identificar TODOS os atores mencionados no registro acima.

ATORES = Pessoas, lideranças, representantes, moradores, organizações, associações, governos.

INSTRUÇÕES CRÍTICAS:
━━━━━━━━━━━━━━━
1. BUSQUE ATIVAMENTE por:
   ✓ Nomes próprios (ex: "João Silva", "Maria Santos")
   ✓ Funções/cargos mencionados (ex: "o presidente", "a secretária", "representante da")
   ✓ Organizações citadas (ex: "Associação de Moradores", "Prefeitura", "CRAS")
   ✓ Grupos mencionados (ex: "liderança local", "comerciantes", "grupo de mulheres")

2. PARA ATORES EXISTENTES:
   - Verifique se o nome/organização JÁ EXISTE na base
   - Se SIM: retorne o ator_id e tipo_vinculo (forte/medio/fraco)
   - Tipo_vinculo FORTE = nome completo ou identificação clara
   - Tipo_vinculo MEDIO = nome parcial com contexto
   - Tipo_vinculo FRACO = apenas função sem nome

3. PARA NOVOS ATORES:
   - Se NÃO existe: retorne dados completos para criar
   - Infira tipo (lideranca, morador, representante, associacao, ong, governo)
   - Tente extrair cargo/função se mencionado
   - Capture contato (telefone/email) se disponível

4. NÃO IGNORE NINGUÉM:
   - Mesmo menções indiretas devem ser capturadas
   - "Fulano comentou que..." = ATOR
   - "Segundo a associação..." = ATOR
   - "Os moradores disseram..." = pode ser grupo de atores

5. CONTEXTO É ESSENCIAL:
   - Inclua onde/como o ator foi mencionado
   - Descreva o papel dele na interação

RETORNE OBRIGATORIAMENTE PELO MENOS 1 ATOR (se houver qualquer menção humana/organizacional).
Se não encontrar NENHUM ator específico, retorne participantes genéricos como novos atores.`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            atores_existentes_detectados: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ator_id: { type: "string" },
                  ator_nome: { type: "string" },
                  tipo_vinculo: { type: "string" },
                  contexto_mencao: { type: "string" },
                  acao_sugerida: { type: "string" }
                }
              }
            },
            novos_atores_identificados: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string" },
                  cargo_funcao: { type: "string" },
                  comunidade_inferida: { type: "string" },
                  organizacao_inferida: { type: "string" },
                  contato_inferido: {
                    type: "object",
                    properties: {
                      telefone: { type: "string" },
                      email: { type: "string" }
                    }
                  },
                  confianca: { type: "string" },
                  contexto: { type: "string" }
                }
              }
            }
          }
        }
      });

      const detectados = [
        ...(resultado.atores_existentes_detectados || []).map(a => ({ ...a, existente: true })),
        ...(resultado.novos_atores_identificados || []).map(a => ({ ...a, existente: false }))
      ];

      setAtoresDetectados(detectados);
      
      // Auto-selecionar vinculações fortes
      const autoSelecionar = detectados
        .filter(a => a.existente && a.tipo_vinculo === 'forte')
        .map(a => a.ator_id);
      setAtoresSelecionados(autoSelecionar);

    } catch (error) {
      console.error('Erro ao detectar atores:', error);
    } finally {
      setDetectando(false);
    }
  };

  const toggleSelecao = (id) => {
    setAtoresSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const criarNovoAtor = async (dadosAtor) => {
    try {
      const novoAtor = await base44.entities.Ator.create({
        nome: dadosAtor.nome,
        tipo: dadosAtor.tipo || 'morador',
        comunidade: dadosAtor.comunidade_inferida || registro.comunidade,
        organizacao: dadosAtor.organizacao_inferida || '',
        cargo: dadosAtor.cargo_funcao || '',
        contato: dadosAtor.contato_inferido || {},
        nivel_influencia: 'medio',
        nivel_atividade: 'moderado',
        temas_interesse: [],
        notas: `Criado automaticamente a partir do registro: ${registro.titulo}\nContexto: ${dadosAtor.contexto}`,
        historico_interacoes: 1,
        ultima_interacao: new Date().toISOString().split('T')[0]
      });

      setAtoresSelecionados(prev => [...prev, novoAtor.id]);
      setAtoresDetectados(prev => prev.map(a => 
        a.nome === dadosAtor.nome ? { ...a, existente: true, ator_id: novoAtor.id } : a
      ));
      
      alert(`✓ Ator "${dadosAtor.nome}" criado com sucesso!`);
    } catch (error) {
      alert('Erro ao criar ator: ' + error.message);
    }
  };

  const confirmarVinculacao = () => {
    if (atoresSelecionados.length === 0) {
      alert('Selecione pelo menos um ator');
      return;
    }
    onAtoresVinculados(atoresSelecionados);
  };

  const corVinculo = (tipo) => {
    switch(tipo) {
      case 'forte': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-amber-100 text-amber-800';
      case 'fraco': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const corConfianca = (confianca) => {
    switch(confianca) {
      case 'alta': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-amber-100 text-amber-800';
      case 'baixa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (detectando) {
    return (
      <Card className="border-2 border-[#40916C]">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#40916C]" />
          <p className="font-semibold">Detectando Atores com IA...</p>
          <p className="text-sm text-gray-600 mt-2">Analisando participantes e contexto</p>
        </CardContent>
      </Card>
    );
  }

  if (atoresDetectados.length === 0) {
    return (
      <Card className="border-2 border-gray-300">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5" />
            Nenhum Ator Detectado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">
            A IA não identificou atores específicos neste registro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#40916C]">
      <CardHeader className="bg-emerald-50">
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <Sparkles className="w-5 h-5" />
          {atoresDetectados.length} Ator(es) Detectado(s)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
          <p className="text-sm font-semibold text-emerald-900 mb-1">
            🤖 Detecção Automática de Atores
          </p>
          <p className="text-xs text-emerald-700">
            Selecione os atores que deseja vincular a este registro:
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {atoresDetectados.map((ator, idx) => (
            <div
              key={idx}
              className={`border-2 rounded-lg p-4 transition-all ${
                ator.existente && atoresSelecionados.includes(ator.ator_id)
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-sm">{ator.nome || ator.ator_nome}</p>
                  {ator.cargo_funcao && (
                    <p className="text-xs text-gray-600">{ator.cargo_funcao}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {ator.existente ? (
                    <>
                      <Badge className={corVinculo(ator.tipo_vinculo)}>
                        {ator.tipo_vinculo}
                      </Badge>
                      <button
                        onClick={() => toggleSelecao(ator.ator_id)}
                        className={`p-1 rounded ${
                          atoresSelecionados.includes(ator.ator_id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {atoresSelecionados.includes(ator.ator_id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <Badge className={corConfianca(ator.confianca)}>
                      Novo - {ator.confianca}
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-700 mb-2">
                {ator.contexto_mencao || ator.contexto}
              </p>

              {!ator.existente && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => criarNovoAtor(ator)}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Criar e Vincular Ator
                </Button>
              )}

              {ator.acao_sugerida && (
                <p className="text-xs text-blue-700 mt-2 italic">
                  💡 {ator.acao_sugerida}
                </p>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={confirmarVinculacao}
          disabled={atoresSelecionados.length === 0}
          className="w-full bg-[#2D6A4F]"
        >
          <Check className="w-4 h-4 mr-2" />
          Vincular {atoresSelecionados.length} Ator(es) ao Registro
        </Button>
      </CardContent>
    </Card>
  );
}