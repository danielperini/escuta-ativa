import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, X, Clock } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function RegistroDevolutiva({ atividade, onFechar, onSalvar }) {
    const [formData, setFormData] = useState({
        conteudo: '',
        resultado: 'em_andamento'
    });

    const handleSalvar = () => {
        if (!formData.conteudo) {
            alert('Por favor, descreva a devolutiva realizada');
            return;
        }

        if (confirm('Confirma o registro desta devolutiva?')) {
            onSalvar(formData);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onFechar}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        Registrar Devolutiva
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Registro Original:</p>
                        <p className="text-sm text-gray-900 font-bold">{atividade.titulo}</p>
                        <p className="text-xs text-gray-600 mt-1">{atividade.local}</p>
                        
                        {atividade.demandas && atividade.demandas.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Demandas:</p>
                                <ul className="space-y-1">
                                    {atividade.demandas.map((d, i) => (
                                        <li key={i} className="text-xs text-gray-700">• {d}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <Label>Descreva a Devolutiva Realizada *</Label>
                        <Textarea
                            value={formData.conteudo}
                            onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                            placeholder="O que foi comunicado? Qual foi a resposta dada? Houve encaminhamento?"
                            rows={6}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label>Resultado da Devolutiva *</Label>
                        <Select 
                            value={formData.resultado} 
                            onValueChange={(val) => setFormData({ ...formData, resultado: val })}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="atendida">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        Atendida (Demanda resolvida)
                                    </div>
                                </SelectItem>
                                <SelectItem value="parcialmente_atendida">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                        Parcialmente Atendida
                                    </div>
                                </SelectItem>
                                <SelectItem value="em_andamento">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        Em Andamento
                                    </div>
                                </SelectItem>
                                <SelectItem value="nao_atendida">
                                    <div className="flex items-center gap-2">
                                        <X className="w-4 h-4 text-red-600" />
                                        Não Atendida (Justificada)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSalvar}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmar Devolutiva
                        </Button>
                        <Button variant="outline" onClick={onFechar}>
                            Cancelar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}