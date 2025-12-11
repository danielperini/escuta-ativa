import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Book, Users, MessageCircle, Heart, Shield, Lightbulb } from "lucide-react";

export default function DicasRelacionamento() {
    const navigate = useNavigate();

    const categorias = [
        {
            icon: MessageCircle,
            titulo: "Técnicas de Escuta Ativa",
            cor: "#3B82F6",
            dicas: [
                "Mantenha contato visual e linguagem corporal aberta",
                "Não interrompa - deixe a pessoa terminar de falar",
                "Faça perguntas abertas para aprofundar o diálogo",
                "Reformule o que foi dito para confirmar entendimento",
                "Demonstre empatia e interesse genuíno",
                "Evite julgar ou dar conselhos prematuros"
            ]
        },
        {
            icon: Heart,
            titulo: "Comunicação Não Violenta",
            cor: "#10B981",
            dicas: [
                "Observe os fatos sem julgar ou interpretar",
                "Identifique e expresse sentimentos com clareza",
                "Reconheça as necessidades por trás das emoções",
                "Faça pedidos claros e específicos",
                "Use 'eu' em vez de 'você' para evitar acusações",
                "Valide os sentimentos da outra pessoa"
            ]
        },
        {
            icon: Users,
            titulo: "Facilitação de Reuniões",
            cor: "#8B5CF6",
            dicas: [
                "Prepare uma pauta clara e compartilhe antecipadamente",
                "Estabeleça regras de convivência no início",
                "Gerencie o tempo e mantenha o foco nos objetivos",
                "Garanta que todos tenham oportunidade de falar",
                "Registre decisões e compromissos assumidos",
                "Faça síntese e alinhamento ao final"
            ]
        },
        {
            icon: Shield,
            titulo: "Conversas Sensíveis",
            cor: "#F59E0B",
            dicas: [
                "Escolha ambiente privado e confortável",
                "Comece explicando o propósito da conversa",
                "Peça permissão antes de abordar temas delicados",
                "Respeite sinais de desconforto e dê espaço",
                "Mantenha confidencialidade quando apropriado",
                "Ofereça apoio e recursos se necessário"
            ]
        },
        {
            icon: Book,
            titulo: "Registro Ético de Informações",
            cor: "#EC4899",
            dicas: [
                "Registre apenas informações relevantes e necessárias",
                "Use linguagem neutra e factual, evite juízos de valor",
                "Proteja identidades quando apropriado (use iniciais)",
                "Diferencie claramente fatos de opiniões",
                "Obtenha consentimento para registros sensíveis",
                "Revise registros antes de compartilhar"
            ]
        },
        {
            icon: Lightbulb,
            titulo: "Mediação de Conflitos",
            cor: "#EF4444",
            dicas: [
                "Mantenha neutralidade e imparcialidade",
                "Permita que cada parte exponha sua perspectiva",
                "Identifique interesses comuns e pontos de convergência",
                "Foque no futuro e em soluções, não no passado",
                "Busque acordos que atendam ambas as partes",
                "Documente acordos feitos de forma clara"
            ]
        }
    ];

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
                    <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                        Dicas de Relacionamento Comunitário
                    </h1>
                </div>

                <Card style={{ borderLeft: '4px solid #F2B632' }}>
                    <CardContent className="pt-6">
                        <p className="text-gray-700">
                            Este guia oferece práticas e técnicas para fortalecer o relacionamento comunitário, 
                            promover diálogos construtivos e construir confiança com os territórios.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categorias.map((categoria, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: categoria.cor }}>
                                        <categoria.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span style={{ color: '#0B1E33' }}>{categoria.titulo}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {categoria.dicas.map((dica, i) => (
                                        <li key={i} className="text-gray-600 text-sm flex gap-2">
                                            <span style={{ color: categoria.cor }}>✓</span>
                                            {dica}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card style={{ backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }}>
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-blue-900 mb-2">
                                    Dicas Contextualizadas com IA
                                </h3>
                                <p className="text-blue-800 text-sm">
                                    O sistema pode sugerir dicas específicas baseadas no contexto de cada registro. 
                                    Por exemplo, se houver indicação de conflito em uma atividade, 
                                    dicas sobre mediação serão automaticamente destacadas.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Elementos de Confiança e Legitimidade
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                                <h4 className="font-bold mb-2" style={{ color: '#0B1E33' }}>Presença Constante</h4>
                                <p className="text-sm text-gray-700">
                                    Mantenha contato regular com a comunidade, não apenas em situações de crise.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
                                <h4 className="font-bold mb-2" style={{ color: '#0B1E33' }}>Cumprimento de Compromissos</h4>
                                <p className="text-sm text-gray-700">
                                    Cumpra o que foi prometido. Se não for possível, comunique com transparência.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: '#DCFCE7' }}>
                                <h4 className="font-bold mb-2" style={{ color: '#0B1E33' }}>Devolutivas</h4>
                                <p className="text-sm text-gray-700">
                                    Informe à comunidade sobre os desdobramentos das conversas e ações tomadas.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ backgroundColor: '#FCE7F3' }}>
                                <h4 className="font-bold mb-2" style={{ color: '#0B1E33' }}>Respeito à Cultura Local</h4>
                                <p className="text-sm text-gray-700">
                                    Compreenda e respeite as dinâmicas, lideranças e valores do território.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}