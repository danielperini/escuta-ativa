import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
    BookOpen, 
    Lightbulb, 
    Search, 
    Sparkles, 
    MapPin, 
    Users, 
    Shield, 
    TrendingUp,
    MessageSquare,
    Target,
    AlertTriangle,
    Loader2,
    ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CAPITULOS = [
    {
        numero: 1,
        titulo: "Relacionamento Construído de Dentro: Comunidade, Presença e Participação",
        icone: Users,
        cor: "#3b82f6",
        resumo: "A relação começa antes do primeiro contato formal: o território já existe e possui sua própria lógica. Participação é governança, não evento. Presença contínua constrói legitimidade; presença apenas em crise gera desconfiança. Escuta é interpretação social, não coleta de dados.",
        dicas: [
            "Registre presença contínua, não apenas em momentos de crise",
            "Faça perguntas abertas e suspenda julgamentos iniciais",
            "Reconheça que cada comunidade tem sua própria história e lógica",
            "Escuta não é coleta de dados, é interpretação social",
            "Participe de forma consistente para construir legitimidade"
        ]
    },
    {
        numero: 2,
        titulo: "Fundamentos, Teoria da Mudança e Teoria U",
        icone: Target,
        cor: "#22c55e",
        resumo: "O relacionamento comunitário exige método + sensibilidade. Fundamentos: escuta ativa, presença, reconhecimento, legitimidade, reciprocidade. A Teoria da Mudança ajuda a enxergar causalidade: ações → resultados → impactos. A Teoria U reforça a importância de observar, suspender julgamentos e co-criar.",
        dicas: [
            "Observe o contexto antes de agir",
            "Suspenda julgamentos e preconceitos",
            "Pratique escuta profunda sem pressa de responder",
            "Relacione ações a resultados e impactos esperados",
            "Co-crie soluções com a comunidade, não para ela"
        ]
    },
    {
        numero: 3,
        titulo: "Dinâmicas Territoriais e Conflitos",
        icone: AlertTriangle,
        cor: "#f59e0b",
        resumo: "Territórios são feitos de camadas históricas e disputas de longo prazo. Não existe comunidade neutra. Lideranças locais são heterogêneas e precisam ser lidas em plural. A chegada da empresa interage com memórias de conflitos anteriores.",
        dicas: [
            "Entenda o histórico de conflitos antes de intervir",
            "Reconheça que lideranças são diversas e plurais",
            "Não trate a comunidade como bloco homogêneo",
            "Memórias de conflitos anteriores influenciam o presente",
            "Mapeie diferentes narrativas sobre o mesmo evento"
        ]
    },
    {
        numero: 4,
        titulo: "Da Escuta à Confiança: Materialidade e Legitimidade",
        icone: MessageSquare,
        cor: "#8b5cf6",
        resumo: "Materialidade é o que importa para a comunidade. Legitimidade é resultado de um ciclo: escuta → reconhecimento → resposta → confiança. Respostas coerentes constroem reciprocidade simbólica.",
        dicas: [
            "Identifique o que realmente importa para a comunidade (materialidade)",
            "Construa o ciclo: escute → reconheça → responda → gere confiança",
            "Seja claro sobre limites institucionais ao responder demandas",
            "Reciprocidade não é transação, é construção de vínculos",
            "Devolutivas devem ser claras mesmo quando a resposta é 'não'"
        ]
    },
    {
        numero: 5,
        titulo: "Ferramentas Práticas de Relacionamento e Participação",
        icone: Lightbulb,
        cor: "#06b6d4",
        resumo: "Inclui mapeamento de stakeholders, roteiros de visita, observação social, escuta qualificada, registro sistemático e técnicas de mobilização.",
        dicas: [
            "Use roteiros de observação social para estruturar visitas",
            "Mapeie stakeholders e suas influências",
            "Registre sistematicamente todas as interações",
            "Identifique: atores, temas, tensões, expectativas",
            "Mobilização começa com conhecimento do território"
        ]
    },
    {
        numero: 6,
        titulo: "A Dimensão Territorial do Investimento Social Privado",
        icone: TrendingUp,
        cor: "#10b981",
        resumo: "Projetos sociais moldam a paisagem simbólica do território. O ISP deve dialogar com vocações locais e equipamentos disponíveis. Valor não está no volume investido, mas na coerência territorial.",
        dicas: [
            "Alinhe projetos sociais às vocações locais",
            "Mapeie equipamentos públicos e organizações já atuantes",
            "Coerência territorial é mais importante que volume de investimento",
            "Projetos devem responder a materialidades reais",
            "Articule ISP com demandas identificadas no relacionamento"
        ]
    },
    {
        numero: 7,
        titulo: "Planejamento, Indicadores e Monitoramento",
        icone: BarChart3,
        cor: "#ef4444",
        resumo: "Planejamento organiza interações em um sistema de conhecimento. Indicadores traduzem sinais sociais em decisões. Monitoramento contínuo evita improviso.",
        dicas: [
            "Planeje interações de forma sistemática",
            "Use indicadores para traduzir sinais sociais em decisões",
            "Monitore continuamente, não apenas em momentos críticos",
            "Registre memória institucional de forma organizada",
            "Indicadores devem refletir materialidades do território"
        ]
    },
    {
        numero: 8,
        titulo: "Intraempreendedorismo no Relacionamento Comunitário",
        icone: Sparkles,
        cor: "#a855f7",
        resumo: "Profissionais precisam agir como empreendedores internos. Decisões devem ser justificadas e registradas (memória técnica). Incertezas se transformam em aprendizado.",
        dicas: [
            "Registre justificativas técnicas para suas decisões",
            "Transforme incertezas em aprendizado institucional",
            "Seja proativo na resolução de problemas",
            "Documente processos para criar memória técnica",
            "Inove dentro dos limites institucionais"
        ]
    },
    {
        numero: 9,
        titulo: "Plano de Relacionamento Comunitário",
        icone: MapPin,
        cor: "#14b8a6",
        resumo: "É a 'espinha dorsal' da atuação territorial. Evita improviso e define responsabilidades. Nasce do diagnóstico socioterritorial.",
        dicas: [
            "Todo relacionamento comunitário precisa de um plano estruturado",
            "O plano nasce do diagnóstico, não de templates genéricos",
            "Define responsabilidades, prazos e formas de atuação",
            "Evita improviso e reações apenas em crises",
            "Deve ser atualizado conforme o território evolui"
        ]
    },
    {
        numero: 10,
        titulo: "Ética e Diálogo",
        icone: Shield,
        cor: "#64748b",
        resumo: "Ética define limites, responsabilidades e transparência. Conversas sensíveis exigem postura profissional. Ética previne danos e evita social washing.",
        dicas: [
            "Seja transparente sobre limites institucionais",
            "Não prometa o que não pode cumprir",
            "Trate dados pessoais com responsabilidade (LGPD)",
            "Evite instrumentalização das relações comunitárias",
            "Social washing é antiético e prejudicial"
        ]
    },
    {
        numero: 11,
        titulo: "Gerenciamento de Riscos Sociais",
        icone: AlertTriangle,
        cor: "#f97316",
        resumo: "Onde há impacto → há retorno institucional. Redução de risco ocorre quando há convivência dialógica. Riscos são percebidos, não apenas medidos.",
        dicas: [
            "Riscos sociais são percepções, não apenas dados objetivos",
            "Convivência dialógica reduz riscos estruturalmente",
            "Identifique sinais precoces de tensão",
            "Responda rapidamente a situações críticas",
            "Gestão de riscos é preventiva, não apenas reativa"
        ]
    },
    {
        numero: 12,
        titulo: "Elaboração e Avaliação de Projetos",
        icone: BookOpen,
        cor: "#ec4899",
        resumo: "O profissional não precisa escrever projetos, mas precisa entendê-los. Avaliação participativa fortalece controle social. Transparência é fundamental.",
        dicas: [
            "Entenda a lógica de projetos sociais mesmo sem escrevê-los",
            "Promova avaliação participativa com a comunidade",
            "Indicadores devem ser compreensíveis localmente",
            "Transparência constrói confiança",
            "Prestação de contas deve ser clara e acessível"
        ]
    }
];

export default function DicasRelacionamento() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const [capituloSelecionado, setCapituloSelecionado] = useState(null);
    const [consultandoIA, setConsultandoIA] = useState(false);
    const [pergunta, setPergunta] = useState("");
    const [respostaIA, setRespostaIA] = useState(null);

    const { data: user } = useQuery({
        queryKey: ['user-idioma'],
        queryFn: () => base44.auth.me()
    });

    const capitulosFiltrados = CAPITULOS.filter(cap => 
        cap.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        cap.resumo.toLowerCase().includes(busca.toLowerCase()) ||
        cap.dicas.some(d => d.toLowerCase().includes(busca.toLowerCase()))
    );

    const consultarIA = async () => {
        if (!pergunta.trim()) {
            alert("Digite uma pergunta");
            return;
        }

        setConsultandoIA(true);
        setRespostaIA(null);

        try {
            const idioma = user?.configuracoes?.idioma_relatorios || 'pt-BR';
            const idiomaTexto = idioma === 'pt-BR' ? 'português brasileiro' : 
                               idioma === 'es' ? 'espanhol' : 'inglês';

            const baseConhecimento = CAPITULOS.map(cap => `
CAPÍTULO ${cap.numero}: ${cap.titulo}
Resumo: ${cap.resumo}
Dicas práticas: ${cap.dicas.join(' | ')}
            `).join('\n\n');

            const prompt = `Você é um especialista em relacionamento comunitário, baseado no livro "Relacionamento Comunitário: um Diálogo Social".

BASE DE CONHECIMENTO:
${baseConhecimento}

PRINCÍPIOS FUNDAMENTAIS:
- Escuta é interpretação social, não coleta de dados
- Presença contínua constrói legitimidade
- Materialidade é o que importa para a comunidade
- Legitimidade = escuta → reconhecimento → resposta → confiança
- Territórios têm camadas históricas e disputas
- Ética define limites e previne danos
- Riscos sociais são percepções, não apenas dados
- Planejamento evita improviso

PERGUNTA DO USUÁRIO:
${pergunta}

RESPONDA em ${idiomaTexto}:
1. Resposta direta e aplicável
2. Dicas práticas baseadas nos capítulos relevantes
3. Perguntas orientadoras para aprofundar a reflexão
4. Alertas éticos ou de risco se aplicável
5. Referência ao(s) capítulo(s) que fundamentam a resposta

Seja claro, prático e contextual. Evite jargão vazio.`;

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        resposta_direta: { type: "string" },
                        dicas_praticas: {
                            type: "array",
                            items: { type: "string" }
                        },
                        perguntas_orientadoras: {
                            type: "array",
                            items: { type: "string" }
                        },
                        alertas: {
                            type: "array",
                            items: { type: "string" }
                        },
                        capitulos_relacionados: {
                            type: "array",
                            items: { type: "number" }
                        }
                    }
                }
            });

            setRespostaIA(resultado);
        } catch (error) {
            alert("Erro ao consultar IA: " + error.message);
        } finally {
            setConsultandoIA(false);
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Dicas de Relacionamento Comunitário
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Base de conhecimento: "Relacionamento Comunitário: um Diálogo Social"
                        </p>
                    </div>
                </div>

                {/* Consultor IA */}
                <Card className="border-2 border-purple-600">
                    <CardHeader className="bg-purple-50">
                        <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Sparkles className="w-6 h-6" />
                            Consultor IA Especializado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-gray-700">
                            Faça perguntas sobre situações práticas de relacionamento comunitário. 
                            A IA responderá com base nos 12 capítulos do livro.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ex: Como lidar com expectativas não realistas da comunidade?"
                                value={pergunta}
                                onChange={(e) => setPergunta(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && consultarIA()}
                            />
                            <Button
                                onClick={consultarIA}
                                disabled={consultandoIA || !pergunta.trim()}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {consultandoIA ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {respostaIA && (
                            <div className="space-y-4 mt-6 p-4 bg-white rounded-lg border-2 border-purple-200">
                                <div>
                                    <h4 className="font-bold text-purple-900 mb-2">Resposta:</h4>
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        {respostaIA.resposta_direta}
                                    </p>
                                </div>

                                {respostaIA.dicas_praticas?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-purple-900 mb-2">Dicas Práticas:</h4>
                                        <ul className="space-y-1">
                                            {respostaIA.dicas_praticas.map((dica, i) => (
                                                <li key={i} className="text-sm text-gray-700">
                                                    ✓ {dica}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {respostaIA.perguntas_orientadoras?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-purple-900 mb-2">Perguntas Orientadoras:</h4>
                                        <ul className="space-y-1">
                                            {respostaIA.perguntas_orientadoras.map((perg, i) => (
                                                <li key={i} className="text-sm text-gray-700 italic">
                                                    • {perg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {respostaIA.alertas?.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded border border-red-200">
                                        <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Alertas:
                                        </h4>
                                        <ul className="space-y-1">
                                            {respostaIA.alertas.map((alerta, i) => (
                                                <li key={i} className="text-sm text-red-800">
                                                    ⚠️ {alerta}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {respostaIA.capitulos_relacionados?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-2 text-xs">Capítulos relacionados:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {respostaIA.capitulos_relacionados.map(num => {
                                                const cap = CAPITULOS.find(c => c.numero === num);
                                                return cap ? (
                                                    <Badge
                                                        key={num}
                                                        className="cursor-pointer"
                                                        style={{ backgroundColor: cap.cor }}
                                                        onClick={() => setCapituloSelecionado(cap)}
                                                    >
                                                        Cap. {num}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Busca */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Buscar por tema, palavra-chave ou dica..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Capítulos */}
                <div className="grid md:grid-cols-2 gap-4">
                    {capitulosFiltrados.map((cap) => {
                        const Icon = cap.icone;
                        const expandido = capituloSelecionado?.numero === cap.numero;

                        return (
                            <Card
                                key={cap.numero}
                                className={`cursor-pointer transition-all hover:shadow-lg ${
                                    expandido ? 'ring-2 ring-offset-2' : ''
                                }`}
                                style={expandido ? { ringColor: cap.cor } : {}}
                                onClick={() => setCapituloSelecionado(expandido ? null : cap)}
                            >
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        <div 
                                            className="p-3 rounded-lg flex-shrink-0"
                                            style={{ backgroundColor: cap.cor + '20' }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: cap.cor }} />
                                        </div>
                                        <div className="flex-1">
                                            <Badge className="mb-2" style={{ backgroundColor: cap.cor }}>
                                                Capítulo {cap.numero}
                                            </Badge>
                                            <CardTitle className="text-base leading-tight">
                                                {cap.titulo}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700 mb-4">
                                        {cap.resumo}
                                    </p>

                                    {expandido && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4" style={{ color: cap.cor }} />
                                                Dicas Práticas:
                                            </h4>
                                            <ul className="space-y-2">
                                                {cap.dicas.map((dica, idx) => (
                                                    <li 
                                                        key={idx} 
                                                        className="flex items-start gap-2 text-sm text-gray-800"
                                                    >
                                                        <span style={{ color: cap.cor }}>✓</span>
                                                        <span>{dica}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {capitulosFiltrados.length === 0 && (
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Nenhum resultado encontrado</p>
                        </CardContent>
                    </Card>
                )}

                {/* Rodapé com informações */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-2">Sobre a Base de Conhecimento</p>
                                <p className="leading-relaxed">
                                    Estas dicas são baseadas na obra <strong>"Relacionamento Comunitário: um Diálogo Social"</strong>, 
                                    que une teoria sociológica, prática territorial e gestão social para construir 
                                    maturidade institucional em ESG por meio de escuta qualificada, materialidade 
                                    socioterritorial, mediação de conflitos e responsabilidade corporativa.
                                </p>
                                <p className="mt-3 text-xs text-blue-700">
                                    💡 Dica: Use o Consultor IA acima para fazer perguntas específicas sobre situações práticas
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}