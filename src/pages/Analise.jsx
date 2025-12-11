import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GrafoRede from "../components/analise/GrafoRede";
import GraficosAnalise from "../components/analise/GraficosAnalise";
import IndicadoresCompromissos from "../components/analise/IndicadoresCompromissos";

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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="rede">Grafo (Rede)</TabsTrigger>
                        <TabsTrigger value="graficos">Gráficos</TabsTrigger>
                        <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
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
                </Tabs>
            </div>
        </div>
    );
}