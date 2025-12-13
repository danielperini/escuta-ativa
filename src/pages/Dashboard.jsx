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
import BotaoPanicoAvancado from "@/components/dashboard/BotaoPanicoAvancado";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Dashboard() {
    const navigate = useNavigate();
    
    const { data: user } = useQuery({
        queryKey: ['currentUser-dashboard'],
        queryFn: () => base44.auth.me()
    });

    const paineisAtivos = user?.configuracoes?.paineis_dashboard || ['kpis', 'demandas_recorrentes', 'devolutivas', 'voz_comunidade'];

    const menuItems = [
        { title: "Atividades", icon: MessageSquare, path: "Atividades", description: "Gerencie reuniões, diálogos e demandas", color: "#3b82f6" },
        { title: "Documentos", icon: FileText, path: "Documentos", description: "Processamento inteligente de documentos", color: "#06b6d4" },
        { title: "Relatórios", icon: BarChart3, path: "Relatorios", description: "Gere relatórios em PDF, DOCX e XLSX", color: "#f97316" },
        { title: "Código de Ética", icon: ShieldCheck, path: "CodigoEtica", description: "Diretrizes éticas e de conduta", color: "#64748b" },
        { title: "Dicas de Relacionamento", icon: Lightbulb, path: "DicasRelacionamento", description: "Boas práticas comunitárias", color: "#eab308" }
    ];

    return (
        <div className="min-h-screen p-4 md:p-6 pb-20 md:pb-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                <div className="text-center space-y-3 md:space-y-4">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/0e1bf5b7b_ChatGPTImage11dedezde202515_14_03.png"
                        alt="Escutativa"
                        className="h-16 md:h-24 mx-auto object-contain"
                    />
                    <p className="text-sm md:text-base text-gray-600 mt-1">Inteligência Aplicada ao Território</p>
                        </div>

                    <div className="mt-6">
                        <BuscaInteligenteGlobal />
                    </div>

                    {paineisAtivos.includes('kpis') && (
                        <div className="mt-6">
                            <DashboardKPIs />
                        </div>
                    )}

                    {paineisAtivos.includes('demandas_recorrentes') && (
                        <div className="mt-6">
                            <MonitorDemandasRecorrentes />
                        </div>
                    )}

                    {paineisAtivos.includes('devolutivas') && (
                        <div className="mt-6">
                            <MonitorDevolutivas />
                        </div>
                    )}

                    {paineisAtivos.includes('voz_comunidade') && (
                        <div className="mt-6">
                            <VozComunidade />
                        </div>
                    )}

                    <div className="flex justify-center">
                            <Button
                                onClick={() => navigate(createPageUrl("Registros"))}
                                size="lg"
                                className="text-base md:text-lg font-bold px-8 md:px-12 py-6 md:py-8 rounded-xl md:rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-300 text-white w-full sm:w-auto"
                                style={{ backgroundColor: '#2D6A4F' }}
                            >
                                <FileText className="w-6 md:w-8 h-6 md:h-8 mr-2 md:mr-3" />
                                Registros
                            </Button>
                        </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
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
                    <BotaoPanicoAvancado />
                </div>
            </div>
        </div>
    );
}