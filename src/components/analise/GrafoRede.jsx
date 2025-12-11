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
        periodo: "2anos"
    });
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [draggingNode, setDraggingNode] = useState(null);

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

        // Criar arestas baseadas em atividades
        atividades.forEach(ativ => {
            if (ativ.liderancas_relacionadas && ativ.liderancas_relacionadas.length > 0) {
                ativ.liderancas_relacionadas.forEach(lidId => {
                    // Conectar lideranças entre si na mesma atividade
                    ativ.liderancas_relacionadas.forEach(outroLidId => {
                        if (lidId !== outroLidId) {
                            edgesArray.push({
                                from: `lid-${lidId}`,
                                to: `lid-${outroLidId}`,
                                label: 'Reunião compartilhada',
                                weight: 1
                            });
                        }
                    });

                    // Conectar lideranças com organizações
                    if (ativ.organizacoes_relacionadas) {
                        ativ.organizacoes_relacionadas.forEach(orgId => {
                            edgesArray.push({
                                from: `lid-${lidId}`,
                                to: `org-${orgId}`,
                                label: 'Colaboração',
                                weight: 1
                            });
                        });
                    }
                });
            }
        });

        setNodes(Array.from(nodesMap.values()));
        setEdges(edgesArray);
    }, [atividades, liderancas, organizacoes, comunidades]);

    useEffect(() => {
        if (!canvasRef.current || nodes.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = 600;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Desenhar arestas
            ctx.strokeStyle = '#D1D5DB';
            ctx.lineWidth = 1;
            edges.forEach(edge => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (fromNode && toNode) {
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x, fromNode.y);
                    ctx.lineTo(toNode.x, toNode.y);
                    ctx.stroke();
                }
            });

            // Desenhar nós
            nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
                
                // Cores por tipo
                if (node.type === 'lideranca') {
                    ctx.fillStyle = '#F2B632';
                } else if (node.type === 'organizacao') {
                    ctx.fillStyle = '#8B5CF6';
                } else {
                    ctx.fillStyle = '#0B1E33';
                }
                
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Label
                ctx.fillStyle = '#000';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.label.substring(0, 15), node.x, node.y + 35);
            });
        };

        draw();

        // Interatividade
        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const clickedNode = nodes.find(n => {
                const dx = n.x - x;
                const dy = n.y - y;
                return Math.sqrt(dx * dx + dy * dy) < 20;
            });

            if (clickedNode) {
                setDraggingNode(clickedNode);
            }
        };

        const handleMouseMove = (e) => {
            if (draggingNode) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                setNodes(prev => prev.map(n => 
                    n.id === draggingNode.id ? { ...n, x, y } : n
                ));
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
    }, [nodes, edges, draggingNode]);

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
                    {nodes.length === 0 ? (
                        <div className="flex items-center justify-center h-96 text-gray-500">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                                <p>Carregando dados da rede...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <canvas 
                                ref={canvasRef} 
                                className="w-full border rounded-lg cursor-move"
                                style={{ height: '600px' }}
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Arraste os nós para reorganizar a visualização
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}