import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GrafoRede from "../components/analise/GrafoRede";
import GraficosAnalise from "../components/analise/GraficosAnalise";
import IndicadoresCompromissos from "../components/analise/IndicadoresCompromissos";
import SugestoesIA from "../components/analise/SugestoesIA";
import ModeloPredicaoTensao from "../components/analise/ModeloPredicaoTensao";
import RadarGovernanca from "../components/analise/RadarGovernanca";
import LiderancasEmergentes from "../components/analise/LiderancasEmergentes";
import ComparativoTerritorial from "../components/analise/ComparativoTerritorial";
import StorytellingTerritorial from "../components/analise/StorytellingTerritorial";

export default function Analise() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-full mx-auto space-y-6">
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
                        Análise Territorial
                    </h1>
                </div>

                <Tabs defaultValue="rede" className="w-full">
                    <TabsList className="grid w-full grid-cols-8 text-xs">
                        <TabsTrigger value="rede">Grafo</TabsTrigger>
                        <TabsTrigger value="graficos">Gráficos</TabsTrigger>
                        <TabsTrigger value="indicadores">Compromissos</TabsTrigger>
                        <TabsTrigger value="predicao">Previsão</TabsTrigger>
                        <TabsTrigger value="governanca">Governança</TabsTrigger>
                        <TabsTrigger value="liderancas">Lideranças</TabsTrigger>
                        <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                        <TabsTrigger value="sugestoes">IA</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rede" className="mt-6">
                        <GrafoRede />
                    </TabsContent>

                    <TabsContent value="graficos" className="mt-6">
                        <GraficosAnalise />
                    </TabsContent>

                    <TabsContent value="indicadores" className="mt-6">
                        <IndicadoresCompromissos />
                    </TabsContent>

                    <TabsContent value="predicao" className="mt-6">
                        <ModeloPredicaoTensao />
                    </TabsContent>

                    <TabsContent value="governanca" className="mt-6">
                        <RadarGovernanca />
                    </TabsContent>

                    <TabsContent value="liderancas" className="mt-6">
                        <LiderancasEmergentes />
                    </TabsContent>

                    <TabsContent value="comparativo" className="mt-6">
                        <ComparativoTerritorial />
                    </TabsContent>

                    <TabsContent value="sugestoes" className="mt-6">
                        <SugestoesIA />
                    </TabsContent>
                    </Tabs>
            </div>
        </div>
    );
}