import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Plus, Check } from 'lucide-react';

/**
 * Detecta stakeholders AUTOMATICAMENTE do texto consolidado
 * Cria cadastros provisórios mesmo com informação mínima
 */
export default function DetectorStakeholders({ textoConsolidado, comunidade, municipio, registroId, onStakeholdersVinculados }) {
  const [detectando, setDetectando] = useState(true);
  const [stakeholdersDetectados, setStakeholdersDetectados] = useState([]);
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    detectarStakeholders();
  }, []);

  const detectarStakeholders = async () => {
    try {
      // Buscar stakeholders existentes para fuzzy match
      const existentes = await base44.entities.Stakeholder.list();

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise o texto e identifique TODAS as pessoas e entidades mencionadas.

TEXTO:
${textoConsolidado}

CONTEXTO:
- Comunidade: ${comunidade || 'não especificada'}
- Município: ${municipio || 'não especificado'}

TAREFA: Identificar stakeholders (pessoas e entidades)

REGRAS CRÍTICAS:
1. Incluir mesmo nomes incompletos ("Dona Maria", "Sr. João", "o pescador Pedro")
2. Incluir organizações mesmo sem detalhes completos
3. Não exigir telefone, e-mail ou CPF
4. Priorizar INCLUSÃO sobre perfeição
5. Marcar como "pessoa" ou "entidade"

Para cada stakeholder identificado:
- Nome (como citado no texto)
- Tipo (pessoa/entidade)
- Papel social (se mencionado)
- Organização (se mencionado)
- Contato (apenas se explicitamente mencionado)
- Confiança (alta/media/baixa)

STAKEHOLDERS EXISTENTES (para evitar duplicação):
${existentes.map(s => `- ${s.nome} (${s.comunidade || 'sem comunidade'})`).join('\n')}

Se identificar nome similar aos existentes, marque "stakeholder_existente_id"`,
        response_json_schema: {
          type: "object",
          properties: {
            stakeholders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string", enum: ["pessoa", "entidade"] },
                  papel_social: { type: "string" },
                  organizacao: { type: "string" },
                  contato_telefone: { type: "string" },
                  contato_email: { type: "string" },
                  confianca: { type: "string", enum: ["alta", "media", "baixa"] },
                  stakeholder_existente_id: { type: "string" },
                  motivo_vinculo: { type: "string" }
                }
              }
            }
          }
        }
      });

      setStakeholdersDetectados(resultado.stakeholders || []);

      // Auto-selecionar stakeholders de alta confiança
      const autoSelecionados = (resultado.stakeholders || [])
        .filter(s => s.confianca === 'alta')
        .map((_, idx) => idx);
      setSelecionados(autoSelecionados);

    } catch (error) {
      console.error('Erro ao detectar stakeholders:', error);
    } finally {
      setDetectando(false);
    }
  };

  const toggleSelecao = (index) => {
    setSelecionados(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const confirmarVinculacao = async () => {
    const stakeholdersParaVincular = [];

    for (const index of selecionados) {
      const stakeholder = stakeholdersDetectados[index];

      // Se já existe, apenas atualizar
      if (stakeholder.stakeholder_existente_id) {
        await atualizarStakeholderExistente(stakeholder.stakeholder_existente_id, registroId);
        stakeholdersParaVincular.push(stakeholder.stakeholder_existente_id);
        continue;
      }

      // Criar novo stakeholder provisório
      const proximoId = await obterProximoIdSequencial();
      
      const novoStakeholder = await base44.entities.Stakeholder.create({
        id_sequencial: proximoId,
        nome: stakeholder.nome,
        tipo: stakeholder.tipo,
        subtipo: inferirSubtipo(stakeholder),
        comunidade: comunidade || 'A definir',
        municipio: municipio || 'A definir',
        papel_social: stakeholder.papel_social,
        organizacao: stakeholder.organizacao,
        contato: {
          telefone: stakeholder.contato_telefone || null,
          email: stakeholder.contato_email || null
        },
        primeira_mencao: new Date().toISOString(),
        registro_origem: registroId,
        registros_vinculados: [registroId],
        historico_evolucao: [{
          data: new Date().toISOString(),
          campo_atualizado: 'criacao',
          valor_novo: 'Cadastro criado automaticamente',
          registro_fonte: registroId
        }],
        status_cadastro: 'provisorio',
        nivel_atividade: 'baixo',
        historico_interacoes: 1,
        ultima_interacao: new Date().toISOString().split('T')[0]
      });

      stakeholdersParaVincular.push(novoStakeholder.id);
    }

    if (onStakeholdersVinculados) {
      onStakeholdersVinculados(stakeholdersParaVincular);
    }
  };

  const atualizarStakeholderExistente = async (stakeholderId, registroId) => {
    const stakeholder = await base44.entities.Stakeholder.filter({ id: stakeholderId });
    if (stakeholder.length === 0) return;

    const atual = stakeholder[0];

    await base44.entities.Stakeholder.update(stakeholderId, {
      registros_vinculados: [...new Set([...(atual.registros_vinculados || []), registroId])],
      historico_interacoes: (atual.historico_interacoes || 0) + 1,
      ultima_interacao: new Date().toISOString().split('T')[0],
      historico_evolucao: [
        ...(atual.historico_evolucao || []),
        {
          data: new Date().toISOString(),
          campo_atualizado: 'nova_interacao',
          valor_novo: 'Mencionado em novo registro',
          registro_fonte: registroId
        }
      ]
    });
  };

  const obterProximoIdSequencial = async () => {
    const todos = await base44.entities.Stakeholder.list();
    const maxId = todos.reduce((max, s) => Math.max(max, s.id_sequencial || 0), 0);
    return maxId + 1;
  };

  const inferirSubtipo = (stakeholder) => {
    if (stakeholder.tipo === 'entidade') {
      if (/associa[çc][ãa]o/i.test(stakeholder.nome)) return 'associacao';
      if (/ong|instituto|funda[çc][ãa]o/i.test(stakeholder.nome)) return 'ong';
      if (/prefeitura|secretaria|c[âa]mara/i.test(stakeholder.nome)) return 'governo';
      return 'outro';
    }

    if (/lideran[çc]a|presidente|coordenador/i.test(stakeholder.papel_social || '')) return 'lideranca';
    if (/representante|delegado/i.test(stakeholder.papel_social || '')) return 'representante';
    return 'morador';
  };

  const getConfiancaColor = (confianca) => {
    if (confianca === 'alta') return 'bg-emerald-100 text-emerald-700';
    if (confianca === 'media') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  if (detectando) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#40916C]" />
          <p className="font-medium text-slate-700">Detectando Stakeholders...</p>
          <p className="text-sm text-slate-500 mt-1">Identificando pessoas e entidades mencionadas</p>
        </CardContent>
      </Card>
    );
  }

  if (stakeholdersDetectados.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600">Nenhum stakeholder identificado no texto</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
        <p className="text-sm text-emerald-900 font-medium">
          ✨ {stakeholdersDetectados.length} Stakeholder{stakeholdersDetectados.length !== 1 && 's'} identificado{stakeholdersDetectados.length !== 1 && 's'}
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          Cadastros serão criados/atualizados automaticamente
        </p>
      </div>

      <div className="space-y-2">
        {stakeholdersDetectados.map((stakeholder, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selecionados.includes(index)
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => toggleSelecao(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900">{stakeholder.nome}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {stakeholder.tipo === 'pessoa' ? '👤 Pessoa' : '🏢 Entidade'}
                    </Badge>
                    <Badge className={`text-xs ${getConfiancaColor(stakeholder.confianca)}`}>
                      {stakeholder.confianca}
                    </Badge>
                  </div>

                  {stakeholder.stakeholder_existente_id && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 mb-2">
                      ♻️ Atualizar cadastro existente
                    </Badge>
                  )}

                  <div className="space-y-1 text-sm text-slate-600">
                    {stakeholder.papel_social && <p>📋 {stakeholder.papel_social}</p>}
                    {stakeholder.organizacao && <p>🏛️ {stakeholder.organizacao}</p>}
                    {stakeholder.contato_telefone && <p>📞 {stakeholder.contato_telefone}</p>}
                    {stakeholder.contato_email && <p>✉️ {stakeholder.contato_email}</p>}
                    {stakeholder.motivo_vinculo && (
                      <p className="text-xs text-slate-500 italic mt-2">{stakeholder.motivo_vinculo}</p>
                    )}
                  </div>
                </div>

                {selecionados.includes(index) && (
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={confirmarVinculacao}
        className="w-full bg-[#2D6A4F] hover:bg-[#1B4332]"
        size="lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Criar/Atualizar {selecionados.length} Stakeholder{selecionados.length !== 1 && 's'}
      </Button>
    </div>
  );
}