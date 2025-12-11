import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Sparkles, Check, X, Loader2 } from "lucide-react";

export default function SugestoesConexoes({ atividade, onConexoesAtualizadas }) {
    const [sugestoes, setSugestoes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processando, setProcessando] = useState({});

    const analisarConexoes = async () => {
        setLoading(true);
        try {
            const [todasLiderancas, todasOrganizacoes] = await Promise.all([
                base44.entities.LiderancaComunitaria.list(),
                base44.entities.ProjetoOrganizacao.list()
            ]);

            const prompt = `Analise a seguinte atividade e sugira conexões com lideranças e organizações existentes:

ATIVIDADE:
Título: ${atividade.titulo}
Descrição: ${atividade.descricao}
Participantes: ${(atividade.participantes || []).join(', ')}
Local: ${atividade.local || 'não especificado'}
Transcrição: ${atividade.transcricao_ia || ''}

LIDERANÇAS EXISTENTES:
${todasLiderancas.map(l => `- ${l.nome} (${l.comunidade}, ${l.papel_na_comunidade || 'sem papel definido'})`).join('\n')}

ORGANIZAÇÕES EXISTENTES:
${todasOrganizacoes.map(o => `- ${o.nome_oficial} (${o.natureza || 'sem natureza definida'}, ${o.area_de_atuacao || 'sem área definida'})`).join('\n')}

Identifique:
1. Lideranças que podem estar relacionadas (por nome, comunidade, contexto)
2. Organizações que podem estar relacionadas (por nome, área de atuação, contexto)
3. Novas lideranças que devem ser criadas com base no texto
4. Novas organizações que devem ser criadas com base no texto

Para cada sugestão, forneça:
- justificativa clara
- nível de confiança (alto/médio/baixo)`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        liderancas_existentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    nome: { type: "string" },
                                    justificativa: { type: "string" },
                                    confianca: { type: "string" }
                                }
                            }
                        },
                        organizacoes_existentes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    nome: { type: "string" },
                                    justificativa: { type: "string" },
                                    confianca: { type: "string" }
                                }
                            }
                        },
                        novas_liderancas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    comunidade: { type: "string" },
                                    papel_na_comunidade: { type: "string" },
                                    justificativa: { type: "string" }
                                }
                            }
                        },
                        novas_organizacoes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    natureza: { type: "string" },
                                    area_de_atuacao: { type: "string" },
                                    justificativa: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            // Mapear IDs das lideranças e organizações
            const liderancasSugeridas = (resultado.liderancas_existentes || []).map(sug => {
                const lideranca = todasLiderancas.find(l => 
                    l.nome.toLowerCase().includes(sug.nome.toLowerCase()) ||
                    sug.nome.toLowerCase().includes(l.nome.toLowerCase())
                );
                return lideranca ? { ...sug, id: lideranca.id, lideranca } : null;
            }).filter(Boolean);

            const organizacoesSugeridas = (resultado.organizacoes_existentes || []).map(sug => {
                const org = todasOrganizacoes.find(o => 
                    o.nome_oficial.toLowerCase().includes(sug.nome.toLowerCase()) ||
                    sug.nome.toLowerCase().includes(o.nome_oficial.toLowerCase())
                );
                return org ? { ...sug, id: org.id, organizacao: org } : null;
            }).filter(Boolean);

            setSugestoes({
                liderancas_existentes: liderancasSugeridas,
                organizacoes_existentes: organizacoesSugeridas,
                novas_liderancas: resultado.novas_liderancas || [],
                novas_organizacoes: resultado.novas_organizacoes || []
            });
        } catch (error) {
            alert("Erro ao analisar conexões: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const aceitarLiderancaExistente = async (sugestao) => {
        setProcessando({ ...processando, [`lid-${sugestao.id}`]: true });
        try {
            const liderancasAtuais = atividade.liderancas_relacionadas || [];
            if (!liderancasAtuais.includes(sugestao.id)) {
                await base44.entities.Atividade.update(atividade.id, {
                    liderancas_relacionadas: [...liderancasAtuais, sugestao.id]
                });
                await base44.entities.LiderancaComunitaria.update(sugestao.id, {
                    ultima_interacao: new Date().toISOString()
                });
                if (onConexoesAtualizadas) onConexoesAtualizadas();
            }
        } finally {
            setProcessando({ ...processando, [`lid-${sugestao.id}`]: false });
        }
    };

    const aceitarOrganizacaoExistente = async (sugestao) => {
        setProcessando({ ...processando, [`org-${sugestao.id}`]: true });
        try {
            const organizacoesAtuais = atividade.organizacoes_relacionadas || [];
            if (!organizacoesAtuais.includes(sugestao.id)) {
                await base44.entities.Atividade.update(atividade.id, {
                    organizacoes_relacionadas: [...organizacoesAtuais, sugestao.id]
                });
                await base44.entities.ProjetoOrganizacao.update(sugestao.id, {
                    ultima_interacao: new Date().toISOString()
                });
                if (onConexoesAtualizadas) onConexoesAtualizadas();
            }
        } finally {
            setProcessando({ ...processando, [`org-${sugestao.id}`]: false });
        }
    };

    const criarNovaLideranca = async (dados) => {
        setProcessando({ ...processando, [`new-lid-${dados.nome}`]: true });
        try {
            const novaLideranca = await base44.entities.LiderancaComunitaria.create({
                nome: dados.nome,
                comunidade: dados.comunidade,
                papel_na_comunidade: dados.papel_na_comunidade,
                ultima_interacao: new Date().toISOString()
            });
            
            const liderancasAtuais = atividade.liderancas_relacionadas || [];
            await base44.entities.Atividade.update(atividade.id, {
                liderancas_relacionadas: [...liderancasAtuais, novaLideranca.id]
            });
            
            if (onConexoesAtualizadas) onConexoesAtualizadas();
        } finally {
            setProcessando({ ...processando, [`new-lid-${dados.nome}`]: false });
        }
    };

    const criarNovaOrganizacao = async (dados) => {
        setProcessando({ ...processando, [`new-org-${dados.nome}`]: true });
        try {
            const novaOrg = await base44.entities.ProjetoOrganizacao.create({
                nome_oficial: dados.nome,
                natureza: dados.natureza,
                area_de_atuacao: dados.area_de_atuacao,
                ultima_interacao: new Date().toISOString()
            });
            
            const organizacoesAtuais = atividade.organizacoes_relacionadas || [];
            await base44.entities.Atividade.update(atividade.id, {
                organizacoes_relacionadas: [...organizacoesAtuais, novaOrg.id]
            });
            
            if (onConexoesAtualizadas) onConexoesAtualizadas();
        } finally {
            setProcessando({ ...processando, [`new-org-${dados.nome}`]: false });
        }
    };

    const getConfiancaColor = (confianca) => {
        if (confianca === "alto") return "bg-green-100 text-green-800";
        if (confianca === "médio") return "bg-yellow-100 text-yellow-800";
        return "bg-orange-100 text-orange-800";
    };

    return (
        <Card style={{ borderLeft: '3px solid #F2B632' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: '#0B1E33' }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#F2B632' }} />
                    Sugestões de Conexões (IA)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!sugestoes && (
                    <Button 
                        onClick={analisarConexoes} 
                        disabled={loading}
                        className="w-full"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analisando com IA...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analisar Conexões Automáticas
                            </>
                        )}
                    </Button>
                )}

                {sugestoes && (
                    <>
                        {sugestoes.liderancas_existentes.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold" style={{ color: '#0B1E33' }}>
                                    Lideranças Existentes Sugeridas
                                </h4>
                                {sugestoes.liderancas_existentes.map(sug => (
                                    <div key={sug.id} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{sug.lideranca.nome}</p>
                                                <p className="text-sm text-gray-600">{sug.lideranca.comunidade}</p>
                                                <p className="text-xs text-gray-500 mt-1">{sug.justificativa}</p>
                                            </div>
                                            <Badge className={getConfiancaColor(sug.confianca)}>
                                                {sug.confianca}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => aceitarLiderancaExistente(sug)}
                                                disabled={processando[`lid-${sug.id}`]}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {processando[`lid-${sug.id}`] ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sugestoes.organizacoes_existentes.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold" style={{ color: '#0B1E33' }}>
                                    Organizações Existentes Sugeridas
                                </h4>
                                {sugestoes.organizacoes_existentes.map(sug => (
                                    <div key={sug.id} className="p-3 border rounded-lg space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium">{sug.organizacao.nome_oficial}</p>
                                                <p className="text-sm text-gray-600">{sug.organizacao.natureza}</p>
                                                <p className="text-xs text-gray-500 mt-1">{sug.justificativa}</p>
                                            </div>
                                            <Badge className={getConfiancaColor(sug.confianca)}>
                                                {sug.confianca}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => aceitarOrganizacaoExistente(sug)}
                                                disabled={processando[`org-${sug.id}`]}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                {processando[`org-${sug.id}`] ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3" />
                                                )}
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sugestoes.novas_liderancas.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold" style={{ color: '#0B1E33' }}>
                                    Novas Lideranças a Criar
                                </h4>
                                {sugestoes.novas_liderancas.map((dados, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg space-y-2 bg-blue-50">
                                        <div className="flex-1">
                                            <p className="font-medium">{dados.nome}</p>
                                            <p className="text-sm text-gray-600">{dados.comunidade}</p>
                                            <p className="text-sm text-gray-600">{dados.papel_na_comunidade}</p>
                                            <p className="text-xs text-gray-500 mt-1">{dados.justificativa}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => criarNovaLideranca(dados)}
                                                disabled={processando[`new-lid-${dados.nome}`]}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {processando[`new-lid-${dados.nome}`] ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3 mr-1" />
                                                )}
                                                Criar e Conectar
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sugestoes.novas_organizacoes.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold" style={{ color: '#0B1E33' }}>
                                    Novas Organizações a Criar
                                </h4>
                                {sugestoes.novas_organizacoes.map((dados, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg space-y-2 bg-purple-50">
                                        <div className="flex-1">
                                            <p className="font-medium">{dados.nome}</p>
                                            <p className="text-sm text-gray-600">{dados.natureza}</p>
                                            <p className="text-sm text-gray-600">{dados.area_de_atuacao}</p>
                                            <p className="text-xs text-gray-500 mt-1">{dados.justificativa}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => criarNovaOrganizacao(dados)}
                                                disabled={processando[`new-org-${dados.nome}`]}
                                                className="bg-purple-600 hover:bg-purple-700"
                                            >
                                                {processando[`new-org-${dados.nome}`] ? (
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                ) : (
                                                    <Check className="w-3 h-3 mr-1" />
                                                )}
                                                Criar e Conectar
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sugestoes.liderancas_existentes.length === 0 && 
                         sugestoes.organizacoes_existentes.length === 0 && 
                         sugestoes.novas_liderancas.length === 0 && 
                         sugestoes.novas_organizacoes.length === 0 && (
                            <p className="text-center text-gray-500 py-4">
                                Nenhuma conexão sugerida pela IA neste momento.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}