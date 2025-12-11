import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProcessadorDocumentos from "../components/documentos/ProcessadorDocumentos";
import BuscaDocumentos from "../components/documentos/BuscaDocumentos";
import AnaliseTendencias from "../components/documentos/AnaliseTendencias";

export default function Documentos() {
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
                        Gestão Inteligente de Documentos
                    </h1>
                </div>

                <Tabs defaultValue="processar" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="processar">Processar</TabsTrigger>
                        <TabsTrigger value="buscar">Buscar</TabsTrigger>
                        <TabsTrigger value="tendencias">Tendências</TabsTrigger>
                    </TabsList>

                    <TabsContent value="processar" className="mt-6">
                        <ProcessadorDocumentos />
                    </TabsContent>

                    <TabsContent value="buscar" className="mt-6">
                        <BuscaDocumentos />
                    </TabsContent>

                    <TabsContent value="tendencias" className="mt-6">
                        <AnaliseTendencias />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}