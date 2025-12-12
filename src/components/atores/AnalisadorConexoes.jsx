import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Link2, Users, TrendingUp } from 'lucide-react';

export default function AnalisadorConexoes({ atores, onConexoesDetectadas }) {
  const [analisando, setAnalisando] = useState(false);
  const [conexoes, setConexoes] = useState([]);

  useEffect(() => {
    if (atores && atores.length > 1) {
      analisarConexoes();
    }
  }, [atores]);

  const analisarConexoes = async () => {
    setAnalisando(true);
    try {
      // Buscar registros para análise de co-ocorrências
      const registros = await base44.entities.Registro.list('-created_date', 200);

      const prompt = `Você é um analista de redes sociais especializado em mapear CONEXÕES entre atores comunitários.

ATORES CADASTRADOS:
${JSON.stringify(atores.map(a => ({
  id: a.id,
  nome: a.nome,
  tipo: a.tipo,
  comunidade: a.comunidade,
  organizacao: a.organizacao,
  cargo: a.cargo,
  nivel_influencia: a.nivel_influencia,
  temas_interesse: a.temas_interesse
})), null, 2)}

REGISTROS DE INTERAÇÕES (últimos 200):
${JSON.stringify(registros.slice(0, 100).map(r => ({
  id: r.id,
  comunidade: r.comunidade,
  participantes: r.participantes,
  temas: r.temas_identificados,
  tipo: r.tipo,
  liderancas_vinculadas: r.liderancas_vinculadas,
  organizacoes_vinculadas: r.organizacoes_vinculadas
})), null, 2)}

TAREFA: Identificar TODAS as conexões entre atores com base em:

1. CO-OCORRÊNCIA EM REGISTROS
   - Atores mencionados/presentes nos mesmos registros
   - Frequência de co-ocorrência

2. VÍNCULOS ORGANIZACIONAIS
   - Mesma organização
   - Mesma comunidade
   - Mesmo cargo/papel similar

3. INTERESSES COMUNS
   - Temas de interesse compartilhados
   - Demandas similares

4. HIERARQUIA E INFLUÊNCIA
   - Relações de liderança
   - Representação (quem representa quem)

PARA CADA CONEXÃO, RETORNE:
- IDs dos dois atores conectados
- Tipo de relação (colaboracao, conflito, familia, profissional, representacao, mesmo_tema)
- Força da conexão (0.0 a 1.0)
- Evidências (lista de IDs de registros que comprovam)
- Descrição do relacionamento
- Recomendações de engajamento

IMPORTANTE:
- Seja conservador: apenas retorne conexões com evidência clara
- Priorize conexões fortes e recorrentes
- Identifique atores-chave (hubs da rede)
- Sugira novas conexões potenciais`;

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            conexoes_identificadas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ator1_id: { type: "string" },
                  ator2_id: { type: "string" },
                  tipo_relacao: {
                    type: "string",
                    enum: ["colaboracao", "conflito", "familia", "profissional", "representacao", "mesmo_tema"]
                  },
                  forca_conexao: { type: "number" },
                  evidencias_registro_ids: { type: "array", items: { type: "string" } },
                  descricao: { type: "string" },
                  co_ocorrencias: { type: "number" }
                }
              }
            },
            atores_chave: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ator_id: { type: "string" },
                  motivo: { type: "string" },
                  centralidade: { type: "number" }
                }
              }
            },
            conexoes_sugeridas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ator1_id: { type: "string" },
                  ator2_id: { type: "string" },
                  razao: { type: "string" },
                  potencial: { type: "string", enum: ["baixo", "medio", "alto"] }
                }
              }
            },
            insights: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setConexoes(resultado);
      
      if (onConexoesDetectadas) {
        onConexoesDetectadas(resultado.conexoes_identificadas || []);
      }

      // Criar entidade de conexões se não existir
      for (const conn of (resultado.conexoes_identificadas || [])) {
        const ator1 = atores.find(a => a.id === conn.ator1_id);
        const ator2 = atores.find(a => a.id === conn.ator2_id);
        
        if (ator1 && ator2) {
          try {
            await base44.entities.Ator.update(ator1.id, {
              conexoes: [
                ...(ator1.conexoes || []),
                {
                  ator_id: ator2.id,
                  tipo: conn.tipo_relacao,
                  forca: conn.forca_conexao
                }
              ]
            });
          } catch (error) {
            console.error('Erro ao salvar conexão:', error);
          }
        }
      }

    } catch (error) {
      console.error('Erro ao analisar conexões:', error);
      alert('Erro ao analisar conexões: ' + error.message);
    } finally {
      setAnalisando(false);
    }
  };

  const getTipoRelacaoCor = (tipo) => {
    const cores = {
      colaboracao: 'bg-emerald-100 text-emerald-700',
      conflito: 'bg-red-100 text-red-700',
      familia: 'bg-amber-100 text-amber-700',
      profissional: 'bg-blue-100 text-blue-700',
      representacao: 'bg-purple-100 text-purple-700',
      mesmo_tema: 'bg-slate-100 text-slate-700'
    };
    return cores[tipo] || 'bg-gray-100 text-gray-700';
  };

  if (analisando) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#40916C]" />
          <p className="font-semibold text-slate-900">Analisando Conexões com IA...</p>
          <p className="text-sm text-slate-600 mt-2">
            Identificando relacionamentos entre {atores?.length || 0} atores
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!conexoes.conexoes_identificadas || conexoes.conexoes_identificadas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Link2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-600 mb-4">Nenhuma conexão analisada ainda</p>
          <Button onClick={analisarConexoes} className="gap-2 bg-[#2D6A4F]">
            <Sparkles className="w-4 h-4" />
            Analisar Conexões
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Atores-Chave */}
      {conexoes.atores_chave?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#40916C]" />
              Atores-Chave da Rede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conexoes.atores_chave.map((chave, i) => {
              const ator = atores.find(a => a.id === chave.ator_id);
              return (
                <div key={i} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-emerald-900">{ator?.nome}</h4>
                    <Badge className="bg-emerald-600 text-white">
                      Centralidade: {(chave.centralidade * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-emerald-800">{chave.motivo}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Conexões Identificadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {conexoes.conexoes_identificadas.length} Conexões Identificadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conexoes.conexoes_identificadas.map((conn, i) => {
            const ator1 = atores.find(a => a.id === conn.ator1_id);
            const ator2 = atores.find(a => a.id === conn.ator2_id);
            return (
              <div key={i} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{ator1?.nome}</span>
                    <Link2 className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">{ator2?.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTipoRelacaoCor(conn.tipo_relacao)}>
                      {conn.tipo_relacao}
                    </Badge>
                    <Badge variant="outline">
                      {(conn.forca_conexao * 100).toFixed(0)}% forte
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{conn.descricao}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{conn.co_ocorrencias || 0} co-ocorrências</span>
                  <span>•</span>
                  <span>{conn.evidencias_registro_ids?.length || 0} evidências</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Conexões Sugeridas */}
      {conexoes.conexoes_sugeridas?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Conexões Potenciais Sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conexoes.conexoes_sugeridas.map((sug, i) => {
              const ator1 = atores.find(a => a.id === sug.ator1_id);
              const ator2 = atores.find(a => a.id === sug.ator2_id);
              return (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{ator1?.nome}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium">{ator2?.nome}</span>
                    </div>
                    <Badge variant="outline" className={
                      sug.potencial === 'alto' ? 'border-emerald-500 text-emerald-700' :
                      sug.potencial === 'medio' ? 'border-amber-500 text-amber-700' :
                      'border-slate-500 text-slate-700'
                    }>
                      {sug.potencial}
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-800">{sug.razao}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {conexoes.insights?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Insights da Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {conexoes.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-[#40916C] mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={analisarConexoes} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Reanalisar Conexões
        </Button>
      </div>
    </div>
  );
}