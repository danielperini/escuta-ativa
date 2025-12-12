import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Loader2, Brain, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
];

export default function ModeloPredicaoTensao() {
    const [analisando, setAnalisando] = useState(false);
    const [predicoes, setPredicoes] = useState(null);
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterMunicipio, setFilterMunicipio] = useState('todos');
    const [filterComunidade, setFilterComunidade] = useState('todos');
    const [municipiosEstado, setMunicipiosEstado] = useState([]);
    const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);



    const { data: registros = [] } = useQuery({
        queryKey: ['registros-predicao'],
        queryFn: () => base44.entities.Registro.list('-created_date', 500)
    });

    const { data: compromissos = [] } = useQuery({
        queryKey: ['compromissos-predicao'],
        queryFn: () => base44.entities.Compromisso.list()
    });

    const { data: riscos = [] } = useQuery({
        queryKey: ['riscos-predicao'],
        queryFn: () => base44.entities.RiscoSocial.list()
    });

    // Comunidades únicas dos registros
    const comunidadesUnicas = React.useMemo(() => 
        [...new Set(registros.map(r => r.comunidade).filter(Boolean))].sort(),
        [registros]
    );

    // Buscar municípios do estado selecionado
    const buscarMunicipios = async (estadoSigla) => {
        setCarregandoMunicipios(true);
        try {
            const prompt = `Liste os principais municípios do estado ${ESTADOS_BRASIL.find(e => e.sigla === estadoSigla)?.nome} no Brasil. 
Retorne uma lista com os 20 municípios mais populosos.`;
            
            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        municipios: { type: "array", items: { type: "string" } }
                    }
                }
            });

            setMunicipiosEstado(resultado.municipios || []);
        } catch (error) {
            console.error('Erro ao buscar municípios:', error);
        } finally {
            setCarregandoMunicipios(false);
        }
    };

    React.useEffect(() => {
        if (filterEstado !== 'todos') {
            buscarMunicipios(filterEstado);
            setFilterMunicipio('todos');
        } else {
            setMunicipiosEstado([]);
        }
    }, [filterEstado]);

    const calcularTensao = async () => {
        setAnalisando(true);

        try {
            // Filtrar comunidades pelos registros
            let comunidadesParaAnalisar = comunidadesUnicas;
            
            if (filterComunidade !== 'todos') {
                comunidadesParaAnalisar = [filterComunidade];
            } else if (filterMunicipio !== 'todos') {
                // Filtrar comunidades que podem estar no município
                comunidadesParaAnalisar = comunidadesUnicas.filter(c => 
                    c.toLowerCase().includes(filterMunicipio.toLowerCase())
                );
            }

            const predicoesComunidades = [];

            for (const comunidade of comunidadesParaAnalisar.slice(0, 10)) {
                const registrosCom = registros.filter(r => r.comunidade === comunidade);
                const compromissosCom = compromissos.filter(c => c.comunidade === comunidade);
                const riscosCom = riscos.filter(r => r.comunidade === comunidade && r.status === "ativo");

                const compromissosAtrasados = compromissosCom.filter(c => c.status === "atrasado").length;
                const demandasTotais = registrosCom.flatMap(r => r.demandas || []).length;

                const contexto = `
Comunidade: ${comunidade}

Dados dos Últimos 90 dias:
- Total de Registros: ${registrosCom.length}
- Demandas Registradas: ${demandasTotais}
- Compromissos Assumidos: ${compromissosCom.length}
- Compromissos Atrasados: ${compromissosAtrasados}
- Riscos Sociais Ativos: ${riscosCom.length}

Últimos Registros (resumo):
${registrosCom.slice(0, 5).map(r => `- ${r.descricao?.substring(0, 150)}`).join('\n')}

TAREFA:
Calcule a probabilidade de tensão social nos próximos 14 dias.
Considere: demandas não atendidas, compromissos descumpridos, riscos ativos, tom das interações.
Gere uma previsão detalhada e estruturada.`;

                const resultado = await base44.integrations.Core.InvokeLLM({
                    prompt: contexto,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            probabilidade_tensao: { type: "number", minimum: 0, maximum: 100 },
                            nivel_risco: { type: "string", enum: ["baixo", "moderado", "alto", "critico"] },
                            principais_fatores: { type: "array", items: { type: "string" } },
                            sinais_alerta: { type: "array", items: { type: "string" } },
                            acoes_preventivas: { type: "array", items: { type: "string" } },
                            tendencia: { type: "string", enum: ["crescente", "estavel", "decrescente"] },
                            justificativa: { type: "string" }
                        }
                    }
                });

                predicoesComunidades.push({
                    comunidade,
                    ...resultado
                });
            }

            setPredicoes(predicoesComunidades.sort((a, b) => b.probabilidade_tensao - a.probabilidade_tensao));
        } catch (error) {
            alert("Erro ao gerar previsão: " + error.message);
        } finally {
            setAnalisando(false);
        }
    };

    const getColorByProbabilidade = (prob) => {
        if (prob >= 70) return "text-red-700 bg-red-100";
        if (prob >= 50) return "text-orange-700 bg-orange-100";
        if (prob >= 30) return "text-yellow-700 bg-yellow-100";
        return "text-green-700 bg-green-100";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Modelo Preditivo de Tensão Social
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Estado</Label>
                                <Select value={filterEstado} onValueChange={setFilterEstado}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        {ESTADOS_BRASIL.map(e => (
                                            <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Município</Label>
                                <Select 
                                    value={filterMunicipio} 
                                    onValueChange={setFilterMunicipio}
                                    disabled={filterEstado === 'todos'}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        {municipiosEstado.map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Comunidade</Label>
                                <Select value={filterComunidade} onValueChange={setFilterComunidade}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todas</SelectItem>
                                        {comunidadesUnicas.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button 
                            onClick={calcularTensao}
                            disabled={analisando}
                            className="bg-[#2D6A4F] hover:bg-[#1B4332]"
                        >
                            {analisando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Gerar Previsão
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!predicoes && !analisando && (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Selecione filtros e clique em "Gerar Previsão"</p>
                        <p className="text-sm mt-2">A IA analisará dados históricos e padrões para prever riscos</p>
                    </CardContent>
                </Card>
            )}

            {predicoes && predicoes.length > 0 && (
                <>
                    {predicoes.map((pred) => (
                        <Card key={pred.comunidade} className="border-l-4" style={{
                            borderLeftColor: pred.probabilidade_tensao >= 70 ? '#ef4444' :
                                           pred.probabilidade_tensao >= 50 ? '#f97316' :
                                           pred.probabilidade_tensao >= 30 ? '#f59e0b' : '#22c55e'
                        }}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{pred.comunidade}</CardTitle>
                                        <p className="text-sm text-gray-500 mt-1">Previsão para os próximos 14 dias</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold px-3 py-1 rounded ${getColorByProbabilidade(pred.probabilidade_tensao)}`}>
                                            {Math.round(pred.probabilidade_tensao)}%
                                        </div>
                                        <Badge className="mt-2" variant={
                                            pred.nivel_risco === "critico" ? "destructive" :
                                            pred.nivel_risco === "alto" ? "destructive" : "secondary"
                                        }>
                                            {pred.nivel_risco}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Probabilidade de Tensão</span>
                                        <span className="text-sm text-gray-500">
                                            Tendência: {pred.tendencia === "crescente" ? "📈" : pred.tendencia === "decrescente" ? "📉" : "➡️"} {pred.tendencia}
                                        </span>
                                    </div>
                                    <Progress value={pred.probabilidade_tensao} className="h-3" />
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Justificativa</h4>
                                    <p className="text-sm text-gray-600">{pred.justificativa}</p>
                                </div>

                                {pred.principais_fatores && pred.principais_fatores.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Principais Fatores</h4>
                                        <ul className="space-y-1">
                                            {pred.principais_fatores.map((fator, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-orange-500">•</span>
                                                    {fator}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {pred.sinais_alerta && pred.sinais_alerta.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Sinais de Alerta
                                        </h4>
                                        <ul className="space-y-1">
                                            {pred.sinais_alerta.map((sinal, idx) => (
                                                <li key={idx} className="text-sm text-red-700">⚠️ {sinal}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {pred.acoes_preventivas && pred.acoes_preventivas.length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-2 text-blue-800">Ações Preventivas Recomendadas</h4>
                                        <ul className="space-y-1">
                                            {pred.acoes_preventivas.map((acao, idx) => (
                                                <li key={idx} className="text-sm text-blue-700">✓ {acao}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );
}