import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Link2, Calendar, MapPin, Users, Loader2, Check, X, Percent } from "lucide-react";
import moment from "moment";
import { detectarContinuidadeInteligente } from "@/components/analise/DetectorContinuidadeAvancado";

export default function DetectorContinuidade({ atividadeNova, onVincular, onIgnorar }) {
    const [registrosRelacionados, setRegistrosRelacionados] = useState([]);
    const [verificando, setVerificando] = useState(true);
    const [selecionados, setSelecionados] = useState([]);

    useEffect(() => {
        verificarContinuidade();
    }, []);

    const verificarContinuidade = async () => {
        setVerificando(true);
        try {
            const registros = await base44.entities.Registro.list('-created_date', 50);

            // Usar detector avançado
            const resultado = await detectarContinuidadeInteligente(atividadeNova, registros);

            if (resultado.continuidades_detectadas.length === 0) {
                setRegistrosRelacionados([]);
                setVerificando(false);
                return;
            }

            // Formatar para o formato esperado pelo componente
            const relacionadosFormatados = resultado.continuidades_detectadas.map(cont => ({
                registro_id: cont.registro_id,
                titulo_registro: cont.titulo_registro,
                data_registro: cont.data_registro,
                grau_relacao: cont.grau_relacao,
                score_similaridade: cont.score_similaridade,
                motivo_continuidade: cont.motivo_continuidade,
                elementos_comuns: [
                    ...cont.elementos_comuns.temas_comuns.map(t => `Tema: ${t}`),
                    ...cont.elementos_comuns.atores_comuns.map(a => `Ator: ${a}`),
                    ...cont.elementos_comuns.demandas_relacionadas.map(d => `Demanda: ${d}`)
                ],
                sugestao: cont.recomendacao,
                analise_detalhada: cont.analise_detalhada
            }));

            setRegistrosRelacionados(relacionadosFormatados);

            // Auto-selecionar os de score >= 70
            const autoSelecionar = relacionadosFormatados
                .filter(r => r.score_similaridade >= 70)
                .map(r => r.registro_id);
            setSelecionados(autoSelecionar);

            /* FALLBACK PARA ANÁLISE SIMPLES (caso o avançado falhe)
            const atividades = await base44.entities.Atividade.list('-created_date', 200);

            const prompt = `
Analise se esta NOVA atividade é continuidade de alguma ANTERIOR:

NOVA ATIVIDADE:
${JSON.stringify(atividadeNova, null, 2)}

ATIVIDADES ANTERIORES:
${JSON.stringify(atividades.slice(0, 50), null, 2)}

Critérios de continuidade:
1. Mesmo tema ou tema correlato
2. Mesma liderança envolvida
3. Mesma comunidade
4. Mesma demanda ou demanda relacionada
5. Compromisso pendente relacionado
6. Devolutiva não realizada
7. Histórico relacionado

Para cada continuidade identificada, retorne:
- ID do registro anterior
- grau de relação (baixo/medio/alto/muito_alto)
- motivo da continuidade
- sugestão de vinculação

IMPORTANTE: Seja preciso. Vincular registros incorretos causa confusão.
`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        continuidades_encontradas: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    registro_id: { type: "string" },
                                    titulo_registro: { type: "string" },
                                    data_registro: { type: "string" },
                                    grau_relacao: {
                                        type: "string",
                                        enum: ["baixo", "medio", "alto", "muito_alto"]
                                    },
                                    motivo_continuidade: { type: "string" },
                                    elementos_comuns: {
                                        type: "array",
                                        items: { type: "string" }
                                    },
                                    sugestao: {
                                        type: "string",
                                        enum: ["vincular_fortemente", "vincular_opcionalmente", "apenas_mencionar"]
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const relacionados = resultado.continuidades_encontradas || [];
            setRegistrosRelacionados(relacionados);

            // Auto-selecionar os de grau alto ou muito alto
            const autoSelecionar = relacionados
                .filter(r => r.grau_relacao === 'alto' || r.grau_relacao === 'muito_alto')
                .map(r => r.registro_id);
            setSelecionados(autoSelecionar);
            */

            } catch (error) {
            console.error("Erro ao verificar continuidade:", error);
            } finally {
            setVerificando(false);
            }
            };

    const toggleSelecao = (id) => {
        setSelecionados(
            selecionados.includes(id)
                ? selecionados.filter(s => s !== id)
                : [...selecionados, id]
        );
    };

    const confirmarVinculacao = () => {
        if (selecionados.length === 0) {
            onIgnorar();
            return;
        }

        if (confirm(`Confirma vincular este registro a ${selecionados.length} registro(s) anterior(es)?`)) {
            onVincular(selecionados);
        }
    };

    const corGrau = (grau) => {
        switch (grau) {
            case 'muito_alto': return 'bg-red-100 text-red-800 border-red-600';
            case 'alto': return 'bg-orange-100 text-orange-800 border-orange-600';
            case 'medio': return 'bg-amber-100 text-amber-800 border-amber-600';
            case 'baixo': return 'bg-blue-100 text-blue-800 border-blue-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (verificando) {
        return (
            <Card className="border-2 border-blue-600">
                <CardContent className="pt-6 text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="font-semibold text-gray-900">Verificando Continuidade...</p>
                    <p className="text-sm text-gray-600 mt-2">
                        Analisando registros anteriores com IA
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-blue-600">
            <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Link2 className="w-6 h-6" />
                    {registrosRelacionados.length > 0
                        ? `🔗 ${registrosRelacionados.length} Registro(s) Relacionado(s) Detectado(s)`
                        : '✓ Novo Registro Independente'
                    }
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {registrosRelacionados.length === 0 ? (
                    <div className="space-y-3">
                        <p className="text-gray-700 mb-4">
                            Este registro não possui continuidade com registros anteriores.
                        </p>
                        <div className="space-y-2">
                            <Button onClick={onIgnorar} className="w-full bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-2" />
                                Prosseguir com Registro Novo
                            </Button>
                            <Button onClick={() => window.history.back()} variant="outline" className="w-full">
                                <X className="w-4 h-4 mr-2" />
                                Não Prosseguir com Registro Novo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                                🔍 Continuidade Detectada
                            </p>
                            <p className="text-xs text-blue-700">
                                Este registro parece ser continuidade de atividades anteriores. 
                                Selecione os registros que deseja vincular:
                            </p>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {registrosRelacionados.map((rel) => (
                                <div
                                    key={rel.registro_id}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        selecionados.includes(rel.registro_id)
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => toggleSelecao(rel.registro_id)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{rel.titulo_registro}</p>
                                            {rel.data_registro && (
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {moment(rel.data_registro).format('DD/MM/YYYY')}
                                                    <span>•</span>
                                                    <span>{moment(rel.data_registro).fromNow()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className={corGrau(rel.grau_relacao)}>
                                                {rel.grau_relacao.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            {rel.score_similaridade && (
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <Percent className="w-3 h-3" />
                                                    {rel.score_similaridade}%
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-2">{rel.motivo_continuidade}</p>

                                    <div className="flex flex-wrap gap-2">
                                        {rel.elementos_comuns?.map((elem, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {elem}
                                            </Badge>
                                        ))}
                                    </div>

                                    {selecionados.includes(rel.registro_id) && (
                                        <div className="mt-2 flex items-center gap-2 text-green-700">
                                            <Check className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Selecionado para vinculação</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Button
                                onClick={confirmarVinculacao}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                <Link2 className="w-4 h-4 mr-2" />
                                Atualizar Registro Antigo ({selecionados.length} selecionado{selecionados.length !== 1 ? 's' : ''})
                            </Button>
                            <Button
                                onClick={onIgnorar}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Prosseguir com Registro Novo
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                                className="w-full"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Não Prosseguir com Registro Novo
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}