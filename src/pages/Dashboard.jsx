import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, FileText, Book, Shield, Users, AlertTriangle } from "lucide-react";

export default function Dashboard() {
    const navigate = useNavigate();

    const handlePanico = async () => {
        if (window.confirm("⚠️ Você está prestes a acionar o BOTÃO DE PÂNICO. Deseja continuar?")) {
            alert("Alerta de emergência enviado!");
        }
    };

    const menuItems = [
        { title: "Atividades", icon: Users, path: "Atividades", description: "Gerencie reuniões, diálogos e demandas" },
        { title: "Lideranças Comunitárias", icon: Users, path: "Liderancas", description: "Cadastro de lideranças e interlocutores" },
        { title: "Relatórios", icon: FileText, path: "Relatorios", description: "Gere relatórios em PDF, DOCX e XLSX" },
        { title: "Código de Ética", icon: Shield, path: "CodigoEtica", description: "Diretrizes éticas e de conduta" },
        { title: "Dicas de Relacionamento", icon: Book, path: "DicasRelacionamento", description: "Boas práticas comunitárias" }
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
                    <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                        Escuta Ativa
                    </h1>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={() => navigate(createPageUrl("RegistreEscuta"))}
                        size="lg"
                        className="text-lg font-bold px-12 py-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        <Plus className="w-8 h-8 mr-3" />
                        Registre e Escuta
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
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F2B632' }}>
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

                <div className="flex justify-center mt-8">
                    <Button
                        onClick={handlePanico}
                        variant="outline"
                        className="bg-red-600 hover:bg-red-700 text-white border-0 px-8 py-4 rounded-xl shadow-lg"
                    >
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Botão de Pânico
                    </Button>
                </div>
            </div>
        </div>
    );
}