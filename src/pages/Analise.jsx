import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Target, TrendingUp, Users, AlertTriangle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GrafoRede from "../components/analise/GrafoRede";
import GraficosAnalise from "../components/analise/GraficosAnalise";
import IndicadoresCompromissos from "../components/analise/IndicadoresCompromissos";
import ModeloPredicaoTensao from "../components/analise/ModeloPredicaoTensao";
import LiderancasEmergentes from "../components/analise/LiderancasEmergentes";
import PainelPendencias from "../components/devolutiva/PainelPendencias";
import IntegradorTextoIA from "../components/analise/IntegradorTextoIA";
import DashboardTemperaturaRisco from "../components/analise/DashboardTemperaturaRisco";
import RiscosSociais from "../components/analise/RiscosSociais";

export default function Analise() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Dashboard"))}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Análise Territorial Avançada
                    </h1>
                    <p className="text-slate-500">Dashboards interativos e exportação de relatórios</p>
                </div>
            </div>

            <Tabs defaultValue="temperatura" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="temperatura">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Temperatura
                    </TabsTrigger>
                    <TabsTrigger value="riscos">
                        <Target className="w-4 h-4 mr-2" />
                        Riscos Sociais
                    </TabsTrigger>
                    <TabsTrigger value="graficos">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Gráficos
                    </TabsTrigger>
                    <TabsTrigger value="compromissos">
                        <Target className="w-4 h-4 mr-2" />
                        Compromissos
                    </TabsTrigger>
                    <TabsTrigger value="pendencias">
                        <FileText className="w-4 h-4 mr-2" />
                        Pendências
                    </TabsTrigger>
                    <TabsTrigger value="liderancas">
                        <Users className="w-4 h-4 mr-2" />
                        Lideranças
                    </TabsTrigger>
                    <TabsTrigger value="integrador">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Integrador IA
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="temperatura" className="mt-6">
                    <DashboardTemperaturaRisco />
                </TabsContent>

                <TabsContent value="riscos" className="mt-6">
                    <RiscosSociais />
                </TabsContent>

                <TabsContent value="graficos" className="mt-6">
                    <GraficosAnalise />
                </TabsContent>

                <TabsContent value="compromissos" className="mt-6">
                    <IndicadoresCompromissos />
                </TabsContent>

                <TabsContent value="pendencias" className="mt-6">
                    <PainelPendencias />
                </TabsContent>

                <TabsContent value="liderancas" className="mt-6">
                    <LiderancasEmergentes />
                </TabsContent>

                <TabsContent value="integrador" className="mt-6">
                    <IntegradorTextoIA />
                </TabsContent>
            </Tabs>
        </div>
    );
}