import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function PersonalizacaoCampos({ camposDisponiveis, camposSelecionados, onCamposChange }) {
    const handleToggleCampo = (campo) => {
        if (camposSelecionados.includes(campo)) {
            onCamposChange(camposSelecionados.filter(c => c !== campo));
        } else {
            onCamposChange([...camposSelecionados, campo]);
        }
    };

    const selecionarTodos = () => {
        onCamposChange(camposDisponiveis);
    };

    const limparSelecao = () => {
        onCamposChange([]);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Personalizar Campos</CardTitle>
                    <div className="flex gap-2">
                        <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={selecionarTodos}
                        >
                            Todos
                        </Badge>
                        <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={limparSelecao}
                        >
                            Limpar
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                    Selecione os campos que deseja incluir no relatório exportado:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {camposDisponiveis.map(campo => (
                        <div key={campo} className="flex items-center space-x-2">
                            <Checkbox
                                id={campo}
                                checked={camposSelecionados.includes(campo)}
                                onCheckedChange={() => handleToggleCampo(campo)}
                            />
                            <Label
                                htmlFor={campo}
                                className="text-sm font-normal cursor-pointer"
                            >
                                {campo.replace(/_/g, ' ').charAt(0).toUpperCase() + campo.replace(/_/g, ' ').slice(1)}
                            </Label>
                        </div>
                    ))}
                </div>
                <div className="mt-4 bg-green-50 p-3 rounded">
                    <p className="text-xs text-green-800">
                        ✓ {camposSelecionados.length} de {camposDisponiveis.length} campos selecionados
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}