import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Headphones } from "lucide-react";

export default function Welcome() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-8">
                    <div className="flex justify-center">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-6 shadow-lg">
                            <Headphones className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                        Seja bem-vindo à<br />Escuta Ativa
                    </h1>
                    
                    <Button
                        onClick={() => navigate(createPageUrl("Etapa1"))}
                        size="lg"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Entrar
                    </Button>
                </div>
            </div>
        </div>
    );
}