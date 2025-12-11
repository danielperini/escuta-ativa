import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function GrafoRede() {
    const canvasRef = useRef(null);
    const [filtros, setFiltros] = useState({
        comunidade: "todas",
        tipoAtor: "todos",
        tema: "todos",
        sentimento: "todos",
        periodo: "2anos"
    });
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [draggingNode, setDraggingNode] = useState(null);
    const [analiseRede, setAnaliseRede] = useState(null);
    const [analisando, setAnalisando] = useState(false);
    const [nodeHover, setNodeHover] = useState(null);

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-analise'],
        queryFn: () => base44.entities.Atividade.list()
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-analise'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    const { data: organizacoes = [] } = useQuery({
        queryKey: ['organizacoes-analise'],
        queryFn: () => base44.entities.ProjetoOrganizacao.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-analise'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    useEffect(() => {
        if (atividades.length === 0) return;

        // Construir nós e arestas
        const nodesMap = new Map();
        const edgesArray = [];

        // Adicionar lideranças como nós
        liderancas.forEach(lid => {
            nodesMap.set(`lid-${lid.id}`, {
                id: `lid-${lid.id}`,
                label: lid.nome,
                type: 'lideranca',
                comunidade: lid.comunidade,
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50
            });
        });

        // Adicionar organizações como nós
        organizacoes.forEach(org => {
            nodesMap.set(`org-${org.id}`, {
                id: `org-${org.id}`,
                label: org.nome_oficial,
                type: 'organizacao',
                natureza: org.natureza,
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50
            });
        });

        // Adicionar comunidades como nós
        comunidades.forEach(com => {
            nodesMap.set(`com-${com.id}`, {
                id: `com-${com.id}`,
                label: com.nome,
                type: 'comunidade',
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50
            });
        });

        // Criar arestas baseadas em atividades com mais metadados
        const edgeWeightMap = new Map();
        
        atividades.forEach(ativ => {
            const temas = ativ.temas_identificados || [];
            const sentimento = ativ.transcricao_ia ? "analisado" : "neutro";
            
            if (ativ.liderancas_relacionadas && ativ.liderancas_relacionadas.length > 0) {
                ativ.liderancas_relacionadas.forEach(lidId => {
                    // Conectar lideranças entre si na mesma atividade
                    ativ.liderancas_relacionadas.forEach(outroLidId => {
                        if (lidId !== outroLidId) {
                            const edgeKey = `lid-${lidId}_lid-${outroLidId}`;
                            const existing = edgeWeightMap.get(edgeKey);
                            
                            if (existing) {
                                existing.weight += 1;
                                existing.temas = [...new Set([...existing.temas, ...temas])];
                            } else {
                                edgeWeightMap.set(edgeKey, {
                                    from: `lid-${lidId}`,
                                    to: `lid-${outroLidId}`,
                                    label: 'Reunião compartilhada',
                                    weight: 1,
                                    temas: temas,
                                    sentimento: sentimento
                                });
                            }
                        }
                    });

                    // Conectar lideranças com organizações
                    if (ativ.organizacoes_relacionadas) {
                        ativ.organizacoes_relacionadas.forEach(orgId => {
                            const edgeKey = `lid-${lidId}_org-${orgId}`;
                            const existing = edgeWeightMap.get(edgeKey);
                            
                            if (existing) {
                                existing.weight += 1;
                                existing.temas = [...new Set([...existing.temas, ...temas])];
                            } else {
                                edgeWeightMap.set(edgeKey, {
                                    from: `lid-${lidId}`,
                                    to: `org-${orgId}`,
                                    label: 'Colaboração',
                                    weight: 1,
                                    temas: temas,
                                    sentimento: sentimento
                                });
                            }
                        });
                    }
                });
            }
        });

        // Calcular métricas dos nós
        const nodeConnections = new Map();
        Array.from(edgeWeightMap.values()).forEach(edge => {
            nodeConnections.set(edge.from, (nodeConnections.get(edge.from) || 0) + edge.weight);
            nodeConnections.set(edge.to, (nodeConnections.get(edge.to) || 0) + edge.weight);
        });

        const nodesWithMetrics = Array.from(nodesMap.values()).map(node => ({
            ...node,
            connections: nodeConnections.get(node.id) || 0,
            centralidade: nodeConnections.get(node.id) || 0
        }));

        setNodes(nodesWithMetrics);
        setEdges(Array.from(edgeWeightMap.values()));
    }, [atividades, liderancas, organizacoes, comunidades]);

    // Aplicar filtros
    const nodesFiltrados = nodes.filter(node => {
        if (filtros.comunidade !== "todas" && node.comunidade !== filtros.comunidade) return false;
        if (filtros.tipoAtor !== "todos" && node.type !== filtros.tipoAtor) return false;
        return true;
    });

    const edgesFiltradas = edges.filter(edge => {
        const fromExists = nodesFiltrados.find(n => n.id === edge.from);
        const toExists = nodesFiltrados.find(n => n.id === edge.to);
        if (!fromExists || !toExists) return false;
        
        if (filtros.tema !== "todos" && !edge.temas.includes(filtros.tema)) return false;
        if (filtros.sentimento !== "todos" && edge.sentimento !== filtros.sentimento) return false;
        
        return true;
    });

    const analisarRede = async () => {
        setAnalisando(true);
        
        try {
            const prompt = `
Analise a seguinte rede social territorial e identifique:

DADOS DA REDE:
Total de nós: ${nodes.length}
Total de conexões: ${edges.length}

NÓSTIPOS:
${nodes.map(n => `${n.label} (${n.type}) - ${n.connections} conexões`).join('\n')}

CONEXÕES:
${edges.map(e => `${e.from} ↔ ${e.to} (força: ${e.weight})`).slice(0, 50).join('\n')}

TAREFA DE ANÁLISE:

1. ATORES CENTRAIS (HUBS):
   Identifique os top 5 atores mais conectados e influentes na rede.
   Explique por que são centrais e seu papel estratégico.

2. PONTOS DE ESTRANGULAMENTO (BOTTLENECKS):
   Identifique atores que, se removidos, fragmentariam significativamente a rede.
   Esses são pontos de vulnerabilidade críticos.

3. CLUSTERS E SUBCOMUNIDADES:
   Identifique grupos densamente conectados.
   Explique a natureza de cada cluster.

4. ATORES PERIFÉRICOS:
   Identifique atores com poucas conexões que poderiam ser melhor integrados.

5. LACUNAS NA REDE (MISSING LINKS):
   Sugira conexões que DEVERIAM existir mas não existem.
   Justifique por que essas conexões fariam sentido.

6. FORTALECIMENTO DE LAÇOS:
   Identifique conexões fracas que deveriam ser fortalecidas.
   Sugira ações concretas para isso.

7. DIVERSIDADE DA REDE:
   Avalie se há excesso de homogeneidade ou boa diversidade de atores.

8. RECOMENDAÇÕES ESTRATÉGICAS:
   Sugira ações para otimizar a rede territorial.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        atores_centrais: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    centralidade: { type: "number" },
                                    papel_estrategico: { type: "string" }
                                }
                            }
                        },
                        pontos_estrangulamento: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    risco: { type: "string" },
                                    impacto_remocao: { type: "string" }
                                }
                            }
                        },
                        clusters: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    nome: { type: "string" },
                                    membros: { type: "array", items: { type: "string" } },
                                    caracteristica: { type: "string" }
                                }
                            }
                        },
                        atores_perifericos: {
                            type: "array",
                            items: { type: "string" }
                        },
                        conexoes_sugeridas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    de: { type: "string" },
                                    para: { type: "string" },
                                    justificativa: { type: "string" },
                                    beneficio: { type: "string" }
                                }
                            }
                        },
                        lacos_fortalecer: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    de: { type: "string" },
                                    para: { type: "string" },
                                    acao_sugerida: { type: "string" }
                                }
                            }
                        },
                        recomendacoes: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setAnaliseRede(resultado);
        } catch (error) {
            console.error("Erro ao analisar rede:", error);
            alert("Erro ao analisar rede: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    useEffect(() => {
        if (!canvasRef.current || nodesFiltrados.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 600;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Desenhar arestas com espessura variável
            edgesFiltradas.forEach(edge => {
                const fromNode = nodesFiltrados.find(n => n.id === edge.from);
                const toNode = nodesFiltrados.find(n => n.id === edge.to);
                if (fromNode && toNode) {
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x, fromNode.y);
                    ctx.lineTo(toNode.x, toNode.y);
                    
                    // Cor baseada em peso
                    const opacity = Math.min(0.2 + (edge.weight * 0.2), 1);
                    ctx.strokeStyle = `rgba(107, 114, 128, ${opacity})`;
                    ctx.lineWidth = Math.min(1 + edge.weight, 5);
                    ctx.stroke();
                }
            });

            // Desenhar nós com tamanho baseado em centralidade
            nodesFiltrados.forEach(node => {
                const raio = Math.min(15 + (node.connections * 2), 35);
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, raio, 0, 2 * Math.PI);
                
                // Cores por tipo
                if (node.type === 'lideranca') {
                    ctx.fillStyle = '#F2B632';
                } else if (node.type === 'organizacao') {
                    ctx.fillStyle = '#8B5CF6';
                } else {
                    ctx.fillStyle = '#0B1E33';
                }
                
                ctx.fill();
                
                // Destaque para nó em hover
                if (nodeHover && nodeHover.id === node.id) {
                    ctx.strokeStyle = '#EF4444';
                    ctx.lineWidth = 4;
                } else {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                }
                ctx.stroke();

                // Label
                ctx.fillStyle = '#000';
                ctx.font = node.connections > 5 ? 'bold 12px sans-serif' : '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.label.substring(0, 15), node.x, node.y + raio + 15);
                
                // Badge de conexões
                if (node.connections > 0) {
                    ctx.fillStyle = '#EF4444';
                    ctx.beginPath();
                    ctx.arc(node.x + raio - 5, node.y - raio + 5, 8, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText(node.connections, node.x + raio - 5, node.y - raio + 9);
                }
            });
        };

        draw();

        // Interatividade
        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const clickedNode = nodesFiltrados.find(n => {
                const raio = Math.min(15 + (n.connections * 2), 35);
                const dx = n.x - x;
                const dy = n.y - y;
                return Math.sqrt(dx * dx + dy * dy) < raio;
            });

            if (clickedNode) {
                setDraggingNode(clickedNode);
            }
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (draggingNode) {
                setNodes(prev => prev.map(n => 
                    n.id === draggingNode.id ? { ...n, x, y } : n
                ));
            } else {
                // Hover detection
                const hoveredNode = nodesFiltrados.find(n => {
                    const raio = Math.min(15 + (n.connections * 2), 35);
                    const dx = n.x - x;
                    const dy = n.y - y;
                    return Math.sqrt(dx * dx + dy * dy) < raio;
                });
                setNodeHover(hoveredNode || null);
            }
        };

        const handleMouseUp = () => {
            setDraggingNode(null);
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
        };
    }, [nodesFiltrados, edgesFiltradas, draggingNode, nodeHover]);

    const exportarGrafo = () => {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'grafo-rede-territorial.png';
        a.click();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Comunidade</Label>
                        <Select value={filtros.comunidade} onValueChange={(val) => setFiltros({...filtros, comunidade: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Todas</SelectItem>
                                {comunidades.map(c => (
                                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Tipo de Ator</Label>
                        <Select value={filtros.tipoAtor} onValueChange={(val) => setFiltros({...filtros, tipoAtor: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="lideranca">Lideranças</SelectItem>
                                <SelectItem value="organizacao">Organizações</SelectItem>
                                <SelectItem value="comunidade">Comunidades</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Tema</Label>
                        <Select value={filtros.tema} onValueChange={(val) => setFiltros({...filtros, tema: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                {[...new Set(edges.flatMap(e => e.temas))].slice(0, 10).map(tema => (
                                    <SelectItem key={tema} value={tema}>{tema}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Sentimento</Label>
                        <Select value={filtros.sentimento} onValueChange={(val) => setFiltros({...filtros, sentimento: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="analisado">Analisado</SelectItem>
                                <SelectItem value="neutro">Neutro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Período</Label>
                        <Select value={filtros.periodo} onValueChange={(val) => setFiltros({...filtros, periodo: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                                <SelectItem value="1ano">Último ano</SelectItem>
                                <SelectItem value="2anos">Últimos 2 anos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={analisarRede}
                        disabled={analisando}
                        className="w-full mt-4"
                        style={{ backgroundColor: '#0B1E33' }}
                    >
                        {analisando ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            "Analisar Rede com IA"
                        )}
                    </Button>

                    <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F2B632' }}></div>
                            <span className="text-sm">Lideranças</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                            <span className="text-sm">Organizações</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0B1E33' }}></div>
                            <span className="text-sm">Comunidades</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Rede Social do Território</CardTitle>
                        <Button size="sm" onClick={exportarGrafo} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar PNG
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {nodesFiltrados.length === 0 ? (
                        <div className="flex items-center justify-center h-96 text-gray-500">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                <p>Carregando dados da rede...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {nodesFiltrados.length} nós • {edgesFiltradas.length} conexões
                                </div>
                                {nodeHover && (
                                    <div className="bg-blue-50 px-3 py-2 rounded text-sm">
                                        <span className="font-semibold">{nodeHover.label}</span> • {nodeHover.connections} conexões
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <canvas 
                                    ref={canvasRef} 
                                    className="w-full border rounded-lg cursor-move"
                                    style={{ height: '600px' }}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Arraste os nós para reorganizar • Tamanho = centralidade • Espessura = força da conexão
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {analiseRede && (
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-l-4 border-blue-600">
                        <CardHeader>
                            <CardTitle>🎯 Atores Centrais (Hubs)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analiseRede.atores_centrais?.map((ator, idx) => (
                                    <div key={idx} className="bg-blue-50 p-3 rounded">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-blue-900">{ator.nome}</span>
                                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                                Centralidade: {ator.centralidade}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{ator.papel_estrategico}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-600">
                        <CardHeader>
                            <CardTitle>⚠️ Pontos de Estrangulamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analiseRede.pontos_estrangulamento?.map((ponto, idx) => (
                                    <div key={idx} className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                                        <h4 className="font-bold text-red-900 mb-1">{ponto.nome}</h4>
                                        <p className="text-sm text-red-700 mb-2">
                                            <strong>Risco:</strong> {ponto.risco}
                                        </p>
                                        <p className="text-xs text-gray-700">{ponto.impacto_remocao}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-purple-600">
                        <CardHeader>
                            <CardTitle>🔗 Novas Conexões Sugeridas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analiseRede.conexoes_sugeridas?.map((con, idx) => (
                                    <div key={idx} className="bg-purple-50 p-3 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-purple-900">{con.de}</span>
                                            <span className="text-purple-600">→</span>
                                            <span className="font-semibold text-purple-900">{con.para}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">{con.justificativa}</p>
                                        <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                            <strong>Benefício:</strong> {con.beneficio}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-amber-600">
                        <CardHeader>
                            <CardTitle>💪 Laços a Fortalecer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analiseRede.lacos_fortalecer?.map((laco, idx) => (
                                    <div key={idx} className="bg-amber-50 p-3 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold">{laco.de}</span>
                                            <span>↔</span>
                                            <span className="font-semibold">{laco.para}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{laco.acao_sugerida}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {analiseRede.clusters && analiseRede.clusters.length > 0 && (
                        <Card className="border-l-4 border-green-600">
                            <CardHeader>
                                <CardTitle>🔵 Clusters Identificados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analiseRede.clusters.map((cluster, idx) => (
                                        <div key={idx} className="bg-green-50 p-3 rounded">
                                            <h4 className="font-bold text-green-900 mb-2">{cluster.nome}</h4>
                                            <p className="text-sm text-gray-700 mb-2">{cluster.caracteristica}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {cluster.membros?.map((membro, midx) => (
                                                    <span key={midx} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                                        {membro}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="bg-indigo-50 border-l-4 border-indigo-600">
                        <CardHeader>
                            <CardTitle>📋 Recomendações Estratégicas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {analiseRede.recomendacoes?.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">→ {rec}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}