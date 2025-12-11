import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle } from "lucide-react";

export default function Welcome() {
    const navigate = useNavigate();

    const handlePanico = async () => {
        if (window.confirm("⚠️ Você está prestes a acionar o BOTÃO DE PÂNICO. Deseja continuar?")) {
            // Enviar alerta de pânico
            alert("Alerta de emergência enviado!");
            // Aqui seria a integração real com WhatsApp e e-mail
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0B1E33' }}>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full text-center">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-6">
                        <div className="flex justify-center mb-6">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693acc814baf8083c262896b/efb30c403_ChatGPTImage11dedezde202511_08_47.png"
                                alt="Escuta Ativa"
                                className="h-32 object-contain"
                            />
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: '#0B1E33' }}>
                            Seja bem-vindo à Escuta Ativa — Inteligência Aplicada ao Território
                        </h1>
                        
                        <p className="text-lg text-gray-600">
                            Ferramenta de diálogo social, ética e participação.
                        </p>
                        
                        <Button
                            onClick={() => navigate(createPageUrl("Dashboard"))}
                            size="lg"
                            className="w-full text-white font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            Entrar
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="p-4 flex justify-center">
                <Button
                    onClick={handlePanico}
                    variant="outline"
                    className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-3 rounded-lg"
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Botão de Pânico
                </Button>
            </div>
        </div>
    );
}