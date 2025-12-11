import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FiltrosAvancados({ 
    filtros, 
    onFiltrosChange, 
    comunidades = [], 
    temas = [],
    tiposRegistro = []
}) {
    const handleDataInicioChange = (value) => {
        onFiltrosChange({ ...filtros, dataInicio: value });
    };

    const handleDataFimChange = (value) => {
        onFiltrosChange({ ...filtros, dataFim: value });
    };

    const handleComunidadeChange = (value) => {
        onFiltrosChange({ ...filtros, comunidade: value });
    };

    const handleTipoRegistroChange = (value) => {
        onFiltrosChange({ ...filtros, tipoRegistro: value });
    };

    const handleAdicionarTema = (tema) => {
        if (!filtros.temasSelecionados.includes(tema)) {
            onFiltrosChange({ 
                ...filtros, 
                temasSelecionados: [...filtros.temasSelecionados, tema] 
            });
        }
    };

    const handleRemoverTema = (tema) => {
        onFiltrosChange({ 
            ...filtros, 
            temasSelecionados: filtros.temasSelecionados.filter(t => t !== tema) 
        });
    };

    const limparFiltros = () => {
        onFiltrosChange({
            dataInicio: '',
            dataFim: '',
            comunidade: 'todas',
            tipoRegistro: 'todos',
            temasSelecionados: []
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Filtros Avançados</CardTitle>
                    <Button variant="ghost" size="sm" onClick={limparFiltros}>
                        Limpar Filtros
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Intervalo de Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="block text-sm font-medium mb-2">Data Início</Label>
                        <Input
                            type="date"
                            value={filtros.dataInicio}
                            onChange={(e) => handleDataInicioChange(e.target.value)}
                            max={filtros.dataFim || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <Label className="block text-sm font-medium mb-2">Data Fim</Label>
                        <Input
                            type="date"
                            value={filtros.dataFim}
                            onChange={(e) => handleDataFimChange(e.target.value)}
                            min={filtros.dataInicio}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Comunidade e Tipo de Registro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="block text-sm font-medium mb-2">Comunidade</Label>
                        <Select value={filtros.comunidade} onValueChange={handleComunidadeChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Todas as comunidades</SelectItem>
                                {comunidades.map(c => (
                                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="block text-sm font-medium mb-2">Tipo de Registro</Label>
                        <Select value={filtros.tipoRegistro} onValueChange={handleTipoRegistroChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposRegistro.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Seleção Múltipla de Temas */}
                <div>
                    <Label className="block text-sm font-medium mb-2">Temas (múltipla seleção)</Label>
                    <Select value="" onValueChange={handleAdicionarTema}>
                        <SelectTrigger>
                            <SelectValue placeholder="Adicionar tema..." />
                        </SelectTrigger>
                        <SelectContent>
                            {temas
                                .filter(t => !filtros.temasSelecionados.includes(t.nome))
                                .map(t => (
                                    <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                    
                    {filtros.temasSelecionados.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {filtros.temasSelecionados.map(tema => (
                                <Badge 
                                    key={tema} 
                                    className="cursor-pointer"
                                    style={{ backgroundColor: '#F2B632', color: '#0B1E33' }}
                                    onClick={() => handleRemoverTema(tema)}
                                >
                                    {tema}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resumo dos Filtros Ativos */}
                {(filtros.dataInicio || filtros.dataFim || filtros.comunidade !== 'todas' || 
                  filtros.tipoRegistro !== 'todos' || filtros.temasSelecionados.length > 0) && (
                    <div className="bg-blue-50 p-3 rounded mt-4">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Filtros Ativos:</p>
                        <div className="text-xs text-blue-700 space-y-1">
                            {filtros.dataInicio && <p>• Início: {new Date(filtros.dataInicio).toLocaleDateString('pt-BR')}</p>}
                            {filtros.dataFim && <p>• Fim: {new Date(filtros.dataFim).toLocaleDateString('pt-BR')}</p>}
                            {filtros.comunidade !== 'todas' && <p>• Comunidade: {filtros.comunidade}</p>}
                            {filtros.tipoRegistro !== 'todos' && <p>• Tipo: {tiposRegistro.find(t => t.value === filtros.tipoRegistro)?.label}</p>}
                            {filtros.temasSelecionados.length > 0 && <p>• Temas: {filtros.temasSelecionados.length} selecionados</p>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}