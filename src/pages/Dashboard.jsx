import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Book, Shield, Users, AlertTriangle, MessageSquare, Star, Building, BarChart3, Lightbulb, ShieldCheck } from "lucide-react";
import BuscaInteligenteGlobal from "@/components/BuscaInteligenteGlobal";
import VozComunidade from "@/components/dashboard/VozComunidade";
import DashboardKPIs from "@/components/dashboard/DashboardKPIs";
import MonitorDemandasRecorrentes from "@/components/atores/MonitorDemandasRecorrentes";
import MonitorDevolutivas from "@/components/devolutiva/MonitorDevolutivas";

export default function Dashboard() {
    const navigate = useNavigate();

    const handlePanico = async () => {
        if (window.confirm("⚠️ Você está prestes a acionar o BOTÃO DE PÂNICO. Deseja continuar?")) {
            alert("Alerta de emergência enviado!");
        }
    };

    const menuItems = [
        { title: "Atividades", icon: MessageSquare, path: "Atividades", description: "Gerencie reuniões, diálogos e demandas", color: "#3b82f6" },
        { title: "Lideranças Comunitárias", icon: Star, path: "GerenciarLiderancas", description: "Cadastro de lideranças e interlocutores", color: "#22c55e" },
        { title: "Organizações", icon: Building, path: "GerenciarOrganizacoes", description: "Gerenciar projetos e organizações", color: "#a855f7" },
        { title: "Documentos", icon: FileText, path: "Documentos", description: "Processamento inteligente de documentos", color: "#06b6d4" },
        { title: "Relatórios", icon: BarChart3, path: "Relatorios", description: "Gere relatórios em PDF, DOCX e XLSX", color: "#f97316" },
        { title: "Código de Ética", icon: ShieldCheck, path: "CodigoEtica", description: "Diretrizes éticas e de conduta", color: "#64748b" },
        { title: "Dicas de Relacionamento", icon: Lightbulb, path: "DicasRelacionamento", description: "Boas práticas comunitárias", color: "#eab308" }
    ];

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/efb30c403_ChatGPTImage11dedezde202511_08_47.png"
                        alt="Escuta Ativa"
                        className="h-20 mx-auto object-contain"
                    />
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Escuta Ativa
                        </h1>
                        <p className="text-gray-600 mt-1">Inteligência Aplicada ao Território</p>
                    </div>
                    </div>

                    <div className="mt-6">
                        <BuscaInteligenteGlobal />
                    </div>

                    <div className="mt-6">
                        <DashboardKPIs />
                    </div>

                    <div className="mt-6">
                        <MonitorDemandasRecorrentes />
                    </div>

                    <div className="mt-6">
                        <MonitorDevolutivas />
                    </div>

                    <div className="mt-6">
                        <VozComunidade />
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={() => navigate(createPageUrl("RegistreEscuta"))}
                            size="lg"
                            className="text-lg font-bold px-12 py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            <Plus className="w-8 h-8 mr-3" />
                            Registre Escuta
                        </Button>
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {menuItems.map((item) => (
                        <Card 
                            key={item.path}
                            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2"
                            style={{ borderColor: '#0B1E33' }}
                            onClick={() => navigate(createPageUrl(item.path))}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-xl" style={{ color: '#0B1E33' }}>
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: item.color }}>
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    {item.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-start mt-8">
                    <Button
                        onClick={handlePanico}
                        variant="outline"
                        style={{ backgroundColor: '#C0392B' }}
                        className="hover:opacity-90 text-white border-0 px-8 py-4 rounded-xl shadow-lg"
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Botão de Pânico
                    </Button>
                </div>
            </div>
        </div>
    );
}