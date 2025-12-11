import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Download, CheckCircle, Clock, AlertCircle, XCircle, TrendingUp } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function IndicadoresCompromissos() {
    const [periodo, setPeriodo] = useState("2anos");
    const [comunidadeFiltro, setComunidadeFiltro] = useState("todas");

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-indicadores'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-indicadores'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    // Filtrar por período
    const compromissosFiltrados = compromissos.filter(c => {
        const dataCriacao = new Date(c.created_date);
        const hoje = new Date();
        const diasAtras = {
            "30dias": 30,
            "90dias": 90,
            "6meses": 180,
            "1ano": 365,
            "2anos": 730
        }[periodo];

        const dataLimite = new Date(hoje.setDate(hoje.getDate() - diasAtras));
        const dentroDataLimite = dataCriacao >= dataLimite;
        const dentroFiltro = comunidadeFiltro === "todas" || c.comunidade === comunidadeFiltro;
        return dentroDataLimite && dentroFiltro;
    });

    // Estatísticas
    const total = compromissosFiltrados.length;
    const cumpridos = compromissosFiltrados.filter(c => c.status === "concluido").length;
    const emAndamento = compromissosFiltrados.filter(c => c.status === "em_andamento").length;
    const pendentes = compromissosFiltrados.filter(c => c.status === "pendente").length;
    const atrasados = compromissosFiltrados.filter(c => c.status === "atrasado").length;
    const cancelados = compromissosFiltrados.filter(c => c.status === "cancelado").length;

    const taxaCumprimento = total > 0 ? Math.round((cumpridos / total) * 100) : 0;

    // Compromissos por comunidade
    const compromissosPorComunidade = {};
    comunidades.forEach(com => {
        const compromissosCom = compromissosFiltrados.filter(c => c.comunidade === com.nome);
        const cumpridosCom = compromissosCom.filter(c => c.status === "concluido").length;
        const atrasadosCom = compromissosCom.filter(c => c.status === "atrasado").length;
        compromissosPorComunidade[com.nome] = {
            total: compromissosCom.length,
            cumpridos: cumpridosCom,
            atrasados: atrasadosCom,
            taxa: compromissosCom.length > 0 ? Math.round((cumpridosCom / compromissosCom.length) * 100) : 0
        };
    });

    // Compromissos por região (agregando comunidades)
    const compromissosPorRegiao = {};
    comunidades.forEach(com => {
        const regiao = com.estado || "Região não especificada";
        if (!compromissosPorRegiao[regiao]) {
            compromissosPorRegiao[regiao] = { total: 0, cumpridos: 0, atrasados: 0 };
        }
        const dados = compromissosPorComunidade[com.nome];
        if (dados) {
            compromissosPorRegiao[regiao].total += dados.total;
            compromissosPorRegiao[regiao].cumpridos += dados.cumpridos;
            compromissosPorRegiao[regiao].atrasados += dados.atrasados;
        }
    });

    Object.keys(compromissosPorRegiao).forEach(regiao => {
        const dados = compromissosPorRegiao[regiao];
        dados.taxa = dados.total > 0 ? Math.round((dados.cumpridos / dados.total) * 100) : 0;
    });

    const exportarRelatorio = () => {
        alert("Funcionalidade de exportação será implementada em breve.");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filtros</CardTitle>
                        <Button size="sm" onClick={exportarRelatorio} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar XLSX
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Período</Label>
                            <Select value={periodo} onValueChange={setPeriodo}>
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
                        <div>
                            <Label>Comunidade</Label>
                            <Select value={comunidadeFiltro} onValueChange={setComunidadeFiltro}>
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
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total de Compromissos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold" style={{ color: '#0B1E33' }}>{total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Compromissos Cumpridos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div className="text-3xl font-bold text-green-600">{cumpridos}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Taxa de Cumprimento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold" style={{ color: '#F2B632' }}>{taxaCumprimento}%</div>
                            <Progress value={taxaCumprimento} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-600" />
                            <div className="text-3xl font-bold text-blue-600">{emAndamento}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <div className="text-3xl font-bold text-yellow-600">{pendentes}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Atrasados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-6 h-6 text-red-600" />
                            <div className="text-3xl font-bold text-red-600">{atrasados}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Taxa de Cumprimento por Comunidade
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(compromissosPorComunidade)
                            .filter(([_, dados]) => dados.total > 0)
                            .sort((a, b) => b[1].taxa - a[1].taxa)
                            .map(([comunidade, dados]) => (
                                <div key={comunidade} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{comunidade}</span>
                                            <Badge variant="outline">{dados.cumpridos}/{dados.total}</Badge>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: '#F2B632' }}>
                                            {dados.taxa}%
                                        </span>
                                    </div>
                                    <Progress value={dados.taxa} className="h-2" />
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Taxa de Cumprimento por Região
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(compromissosPorRegiao)
                            .filter(([_, dados]) => dados.total > 0)
                            .sort((a, b) => b[1].taxa - a[1].taxa)
                            .map(([regiao, dados]) => (
                                <div key={regiao} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{regiao}</span>
                                            <Badge variant="outline">{dados.cumpridos}/{dados.total}</Badge>
                                            {dados.atrasados > 0 && (
                                                <Badge className="bg-red-100 text-red-800">
                                                    {dados.atrasados} atrasados
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: '#F2B632' }}>
                                            {dados.taxa}%
                                        </span>
                                    </div>
                                    <Progress value={dados.taxa} className="h-2" />
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Compromissos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {compromissosFiltrados.slice(0, 10).map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium">{c.titulo}</p>
                                    <p className="text-sm text-gray-600">{c.comunidade}</p>
                                    {c.responsavel && (
                                        <p className="text-xs text-gray-500 mt-1">Responsável: {c.responsavel}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge className={
                                        c.status === "concluido" ? "bg-green-100 text-green-800" :
                                        c.status === "em_andamento" ? "bg-blue-100 text-blue-800" :
                                        c.status === "atrasado" ? "bg-red-100 text-red-800" :
                                        "bg-yellow-100 text-yellow-800"
                                    }>
                                        {c.status === "concluido" ? "Cumprido" :
                                         c.status === "em_andamento" ? "Em Andamento" :
                                         c.status === "atrasado" ? "Atrasado" :
                                         c.status === "cancelado" ? "Cancelado" : "Pendente"}
                                    </Badge>
                                    {c.prioridade && (
                                        <Badge variant="outline" className="text-xs">
                                            {c.prioridade}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}