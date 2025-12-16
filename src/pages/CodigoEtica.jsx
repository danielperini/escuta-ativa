import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, Heart, Lock, FileCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CodigoEtica() {
    const navigate = useNavigate();

    const principios = [
        {
            icon: Heart,
            titulo: "Respeito e Dignidade",
            descricao: "Tratar todas as pessoas com respeito, dignidade e consideração, independentemente de origem, gênero, orientação, religião ou condição socioeconômica."
        },
        {
            icon: Shield,
            titulo: "Transparência",
            descricao: "Agir com transparência em todas as interações, comunicando claramente os objetivos, processos e uso das informações coletadas."
        },
        {
            icon: CheckCircle2,
            titulo: "Consentimento Informado",
            descricao: "Obter consentimento claro e informado antes de registrar conversas, coletar dados sensíveis ou capturar imagens/vídeos."
        },
        {
            icon: Lock,
            titulo: "Confidencialidade",
            descricao: "Proteger a privacidade e confidencialidade das informações compartilhadas pela comunidade, garantindo acesso restrito aos dados."
        },
        {
            icon: FileCheck,
            titulo: "Coleta Mínima de Dados",
            descricao: "Coletar apenas os dados estritamente necessários para a finalidade declarada, evitando informações excessivas ou desnecessárias."
        },
        {
            icon: AlertCircle,
            titulo: "Proteção de Dados Sensíveis",
            descricao: "Dados pessoais sensíveis (CPF, endereço completo, condições de saúde) só devem ser coletados quando absolutamente necessários e com consentimento explícito."
        }
    ];

    const diretrizes = [
        {
            titulo: "Antes da Atividade",
            itens: [
                "Apresente-se claramente e explique o propósito da atividade",
                "Informe como as informações serão utilizadas",
                "Peça permissão antes de fotografar, filmar ou gravar áudio",
                "Respeite a decisão de quem não deseja participar"
            ]
        },
        {
            titulo: "Durante a Atividade",
            itens: [
                "Pratique a escuta ativa e empática",
                "Não interrompa ou julgue as falas",
                "Registre apenas o essencial e relevante",
                "Evite coletar dados pessoais desnecessários",
                "Mantenha neutralidade e imparcialidade"
            ]
        },
        {
            titulo: "Após a Atividade",
            itens: [
                "Revise os registros para garantir conformidade ética",
                "Remova ou anonimize dados excessivos ou sensíveis",
                "Armazene informações de forma segura",
                "Compartilhe apenas com pessoas autorizadas",
                "Forneça devolutivas à comunidade quando apropriado"
            ]
        }
    ];

    const lgpdOrientacoes = [
        "Colete apenas dados necessários para a finalidade específica",
        "Informe claramente por que os dados estão sendo coletados",
        "Obtenha consentimento explícito para dados sensíveis",
        "Permita que as pessoas acessem, corrijam ou excluam seus dados",
        "Mantenha os dados seguros e protegidos",
        "Não compartilhe dados com terceiros sem autorização",
        "Exclua dados quando não forem mais necessários"
    ];

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                        Código de Ética
                    </h1>
                </div>

                <Card style={{ borderLeft: '4px solid #F2B632' }}>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Princípios Éticos Fundamentais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {principios.map((principio, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F2B632' }}>
                                        <principio.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1" style={{ color: '#0B1E33' }}>
                                        {principio.titulo}
                                    </h3>
                                    <p className="text-gray-600">{principio.descricao}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Diretrizes de Conduta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {diretrizes.map((diretriz, index) => (
                            <div key={index}>
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: '#0B1E33' }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F2B632' }}></div>
                                    {diretriz.titulo}
                                </h3>
                                <ul className="space-y-2 ml-4">
                                    {diretriz.itens.map((item, i) => (
                                        <li key={i} className="text-gray-600 flex gap-2">
                                            <span style={{ color: '#F2B632' }}>•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Orientações LGPD - Lei Geral de Proteção de Dados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <p className="text-sm text-gray-700">
                                A LGPD estabelece regras para o tratamento de dados pessoais, garantindo privacidade e segurança às pessoas.
                            </p>
                        </div>
                        <ul className="space-y-2">
                            {lgpdOrientacoes.map((orientacao, index) => (
                                <li key={index} className="text-gray-600 flex gap-2">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F2B632' }} />
                                    {orientacao}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }}>
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-2">
                                    Verificações Éticas Automáticas
                                </h3>
                                <p className="text-amber-800 text-sm">
                                    O sistema realiza verificações automáticas com inteligência artificial para identificar possíveis questões éticas nos registros, incluindo:
                                    dados pessoais excessivos, conteúdos sensíveis, situações de risco, discriminação ou exposição indevida.
                                    Quando identificado, o sistema sinaliza para revisão do analista.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}