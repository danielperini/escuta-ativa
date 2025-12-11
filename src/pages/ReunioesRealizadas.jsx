import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Download, Calendar, MapPin, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ReunioesRealizadas() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const [filtroComunidade, setFiltroComunidade] = useState("todas");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [reuniaoSelecionada, setReuniaoSelecionada] = useState(null);

    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-realizadas'],
        queryFn: () => base44.entities.Agenda.list('-data')
    });

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-realizadas'],
        queryFn: () => base44.entities.Atividade.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-realizadas'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const reunioesRealizadas = agendas.filter(a => a.status === "realizada");

    const reunioesFiltradas = reunioesRealizadas.filter(r => {
        const matchBusca = !busca || 
            r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            r.comunidade?.toLowerCase().includes(busca.toLowerCase());
        const matchComunidade = filtroComunidade === "todas" || r.comunidade === filtroComunidade;
        const matchTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
        return matchBusca && matchComunidade && matchTipo;
    });

    const exportarReuniao = async (reuniao) => {
        alert("Exportação será implementada em breve");
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate(createPageUrl("Dashboard"))}
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Reuniões Realizadas
                        </h1>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Buscar</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Título ou comunidade..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Comunidade</Label>
                                <Select value={filtroComunidade} onValueChange={setFiltroComunidade}>
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
                                <Label>Tipo</Label>
                                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="reuniao">Reunião</SelectItem>
                                        <SelectItem value="devolutiva">Devolutiva</SelectItem>
                                        <SelectItem value="encontro">Encontro</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    {reunioesFiltradas.map((reuniao) => (
                        <Card key={reuniao.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader onClick={() => setReuniaoSelecionada(reuniao)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">{reuniao.titulo}</CardTitle>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            {reuniao.data && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(reuniao.data), 'dd/MM/yyyy HH:mm')}
                                                </div>
                                            )}
                                            {reuniao.comunidade && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {reuniao.comunidade}
                                                </div>
                                            )}
                                            {reuniao.tipo && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {reuniao.tipo}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            exportarReuniao(reuniao);
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Exportar
                                    </Button>
                                </div>
                            </CardHeader>
                            {reuniao.descricao && (
                                <CardContent>
                                    <p className="text-gray-600 text-sm">{reuniao.descricao}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>

                {reuniaoSelecionada && (
                    <Dialog open={!!reuniaoSelecionada} onOpenChange={() => setReuniaoSelecionada(null)}>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{reuniaoSelecionada.titulo}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Data</Label>
                                        <p className="font-medium">{format(new Date(reuniaoSelecionada.data), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Comunidade</Label>
                                        <p className="font-medium">{reuniaoSelecionada.comunidade}</p>
                                    </div>
                                </div>

                                {reuniaoSelecionada.descricao && (
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-2">Descrição</Label>
                                        <p className="text-gray-700">{reuniaoSelecionada.descricao}</p>
                                    </div>
                                )}

                                {reuniaoSelecionada.evidencias_realizacao && reuniaoSelecionada.evidencias_realizacao.length > 0 && (
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-2">Evidências</Label>
                                        <div className="space-y-2">
                                            {reuniaoSelecionada.evidencias_realizacao.map((url, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Evidência {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}