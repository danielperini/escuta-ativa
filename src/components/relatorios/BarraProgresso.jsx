import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BarraProgresso({ etapaAtual, etapas }) {
    const [progresso, setProgresso] = useState(0);

    useEffect(() => {
        if (!etapas || etapas.length === 0) return;
        
        const etapaIndex = etapas.findIndex(e => e === etapaAtual);
        const novoProgresso = ((etapaIndex + 1) / etapas.length) * 100;
        setProgresso(novoProgresso);
    }, [etapaAtual, etapas]);

    const etapaIndex = etapas?.findIndex(e => e === etapaAtual) || 0;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                        <Loader2 
                            className="w-16 h-16 mx-auto animate-spin" 
                            style={{ color: '#F2B632' }} 
                        />
                        
                        <div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: '#0B1E33' }}>
                                Gerando Relatório...
                            </h3>
                            <p className="text-sm text-gray-600">
                                {etapaAtual}
                            </p>
                        </div>

                        <Progress value={progresso} className="h-2" />

                        <p className="text-xs text-gray-500">
                            Etapa {etapaIndex + 1} de {etapas?.length || 0}
                        </p>

                        <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 text-left">
                            <p className="font-semibold mb-2">Processando:</p>
                            <ul className="space-y-1">
                                {etapas?.map((etapa, idx) => (
                                    <li 
                                        key={idx} 
                                        className={idx <= etapaIndex ? 'text-blue-700 font-semibold' : 'text-gray-400'}
                                    >
                                        {idx < etapaIndex && '✓ '}
                                        {idx === etapaIndex && '⏳ '}
                                        {etapa}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}