import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, MapPin, Users, FileText, AlertTriangle, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BuscaInteligenteGlobal() {
    const [busca, setBusca] = useState("");
    const [buscando, setBuscando] = useState(false);
    const [resultados, setResultados] = useState(null);
    const navigate = useNavigate();

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-busca'],
        queryFn: () => base44.entities.Atividade.list()
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-busca'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-busca'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-busca'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    const { data: oportunidades = [] } = useQuery({
        queryKey: ['oportunidades-busca'],
        queryFn: () => base44.entities.Oportunidade.list()
    });

    const buscarInteligente = async () => {
        if (!busca.trim()) return;

        setBuscando(true);

        try {
            const contexto = `
BUSCA INTELIGENTE TERRITORIAL

Termo de busca: "${busca}"

Dados Disponíveis:
- ${atividades.length} atividades
- ${liderancas.length} lideranças
- ${comunidades.length} comunidades
- ${riscos.length} riscos sociais
- ${oportunidades.length} oportunidades

TAREFA: Identifique resultados relevantes semanticamente relacionados ao termo de busca.
Não busque apenas correspondência exata de strings - entenda o SIGNIFICADO e CONTEXTO.

Exemplo: Se buscar "conflito", deve encontrar também: tensão, desentendimento, divergência, protesto.
Se buscar "educação", deve incluir: escola, ensino, formação, cursos.

Retorne IDs dos itens mais relevantes de cada categoria.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: contexto,
                response_json_schema: {
                    type: "object",
                    properties: {
                        atividades_relevantes: { type: "array", items: { type: "string" } },
                        liderancas_relevantes: { type: "array", items: { type: "string" } },
                        comunidades_relevantes: { type: "array", items: { type: "string" } },
                        riscos_relevantes: { type: "array", items: { type: "string" } },
                        oportunidades_relevantes: { type: "array", items: { type: "string" } },
                        interpretacao_busca: { type: "string" }
                    }
                }
            });

            const resultadosFiltrados = {
                atividades: atividades.filter(a => resultado.atividades_relevantes?.includes(a.id)),
                liderancas: liderancas.filter(l => resultado.liderancas_relevantes?.includes(l.id)),
                comunidades: comunidades.filter(c => resultado.comunidades_relevantes?.includes(c.id)),
                riscos: riscos.filter(r => resultado.riscos_relevantes?.includes(r.id)),
                oportunidades: oportunidades.filter(o => resultado.oportunidades_relevantes?.includes(o.id)),
                interpretacao: resultado.interpretacao_busca
            };

            setResultados(resultadosFiltrados);
        } catch (error) {
            console.error("Erro na busca:", error);
            alert("Erro ao buscar: " + error.message);
        } finally {
            setBuscando(false);
        }
    };

    const totalResultados = resultados ? 
        (resultados.atividades?.length || 0) + 
        (resultados.liderancas?.length || 0) + 
        (resultados.comunidades?.length || 0) + 
        (resultados.riscos?.length || 0) + 
        (resultados.oportunidades?.length || 0) : 0;

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        placeholder="Busca inteligente: comunidade, tema, ator, risco..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && buscarInteligente()}
                        className="pl-10 h-12"
                    />
                </div>
                <Button
                    onClick={buscarInteligente}
                    disabled={buscando || !busca.trim()}
                    className="h-12 px-6"
                    style={{ backgroundColor: '#F2B632' }}
                >
                    {buscando ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {resultados && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 italic">"{resultados.interpretacao}"</p>
                            <p className="text-sm font-semibold mt-2" style={{ color: '#0B1E33' }}>
                                {totalResultados} resultado(s) encontrado(s)
                            </p>
                        </div>

                        <div className="space-y-4">
                            {resultados.atividades && resultados.atividades.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Atividades ({resultados.atividades.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {resultados.atividades.slice(0, 5).map(a => (
                                            <div key={a.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                                 onClick={() => navigate(createPageUrl("Atividades"))}>
                                                <p className="font-medium text-sm">{a.titulo}</p>
                                                <p className="text-xs text-gray-500 mt-1">{a.descricao?.substring(0, 100)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultados.liderancas && resultados.liderancas.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Lideranças ({resultados.liderancas.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resultados.liderancas.map(l => (
                                            <Badge key={l.id} variant="secondary" className="cursor-pointer"
                                                   onClick={() => navigate(createPageUrl("GerenciarLiderancas"))}>
                                                {l.nome} - {l.comunidade}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultados.comunidades && resultados.comunidades.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        Comunidades ({resultados.comunidades.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {resultados.comunidades.map(c => (
                                            <Badge key={c.id} variant="secondary" className="cursor-pointer"
                                                   onClick={() => navigate(createPageUrl("Mapa"))}>
                                                {c.nome}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultados.riscos && resultados.riscos.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Riscos Sociais ({resultados.riscos.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {resultados.riscos.map(r => (
                                            <div key={r.id} className="p-2 border-l-4 border-red-500 bg-red-50 rounded">
                                                <p className="font-medium text-sm">{r.titulo}</p>
                                                <p className="text-xs text-gray-600">{r.comunidade} - Nível: {r.nivel}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultados.oportunidades && resultados.oportunidades.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4" />
                                        Oportunidades ({resultados.oportunidades.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {resultados.oportunidades.map(o => (
                                            <div key={o.id} className="p-2 border-l-4 border-blue-500 bg-blue-50 rounded">
                                                <p className="font-medium text-sm">{o.titulo}</p>
                                                <p className="text-xs text-gray-600">{o.comunidade} - {o.tipo}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}