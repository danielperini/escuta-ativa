import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Download, TrendingUp, BarChart3, PieChart, Calendar } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const COLORS = ['#F2B632', '#0B1E33', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

export default function GraficosAnalise() {
    const [periodo, setPeriodo] = useState("2anos");

    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-graficos'],
        queryFn: () => base44.entities.Atividade.list()
    });

    const { data: temas = [] } = useQuery({
        queryKey: ['temas-graficos'],
        queryFn: () => base44.entities.Tema.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-graficos'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    // Filtrar atividades por período
    const atividadesFiltradas = atividades.filter(a => {
        const dataAtividade = new Date(a.created_date);
        const hoje = new Date();
        const diasAtras = {
            "30dias": 30,
            "90dias": 90,
            "6meses": 180,
            "1ano": 365,
            "2anos": 730
        }[periodo];

        const dataLimite = new Date(hoje.setDate(hoje.getDate() - diasAtras));
        return dataAtividade >= dataLimite;
    });

    // Temas mais citados
    const temasCitados = {};
    atividadesFiltradas.forEach(a => {
        if (a.temas_identificados) {
            a.temas_identificados.forEach(tema => {
                temasCitados[tema] = (temasCitados[tema] || 0) + 1;
            });
        }
    });

    const dadosTemasCitados = Object.entries(temasCitados)
        .map(([nome, count]) => ({ nome, quantidade: count }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

    // Demandas por comunidade
    const demandasPorComunidade = {};
    atividadesFiltradas.forEach(a => {
        const comunidade = a.local || "Não especificado";
        if (a.demandas && a.demandas.length > 0) {
            demandasPorComunidade[comunidade] = (demandasPorComunidade[comunidade] || 0) + a.demandas.length;
        }
    });

    const dadosDemandasComunidade = Object.entries(demandasPorComunidade)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 8);

    // Série temporal (últimos meses)
    const serieTemporal = {};
    atividadesFiltradas.forEach(a => {
        const mes = new Date(a.created_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        serieTemporal[mes] = (serieTemporal[mes] || 0) + 1;
    });

    const dadosSerieTemporal = Object.entries(serieTemporal)
        .map(([mes, quantidade]) => ({ mes, quantidade }))
        .slice(-12);

    // Distribuição por tipo de atividade
    const tiposAtividade = {};
    atividadesFiltradas.forEach(a => {
        const tipo = a.tipo || "Não especificado";
        tiposAtividade[tipo] = (tiposAtividade[tipo] || 0) + 1;
    });

    const dadosTiposAtividade = Object.entries(tiposAtividade)
        .map(([name, value]) => ({ name, value }));

    const exportarGraficos = () => {
        alert("Funcionalidade de exportação será implementada em breve.");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filtros</CardTitle>
                        <Button size="sm" onClick={exportarGraficos} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Exportar PDF
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label>Período Analisado</Label>
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
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Temas Mais Citados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dadosTemasCitados}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="quantidade" fill="#F2B632" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Distribuição por Tipo de Atividade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={dadosTiposAtividade}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.name}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {dadosTiposAtividade.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Volume de Demandas por Comunidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dadosDemandasComunidade}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="quantidade" fill="#0B1E33" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Série Temporal de Atividades
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dadosSerieTemporal}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="quantidade" stroke="#F2B632" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}