import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, Camera, Video, FileText, Upload, Loader2 } from "lucide-react";

export default function RegistreEscuta() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tipoInput, setTipoInput] = useState(null);

    const processarInput = async (tipo, file = null, texto = null) => {
        setLoading(true);

        try {
            let transcricao = "";
            let anexos = [];

            if (file) {
                // Upload do arquivo
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                anexos.push(file_url);

                // Processar com IA
                const prompt = tipo === 'audio' 
                    ? `Transcreva o áudio fornecido e extraia: temas principais, demandas mencionadas, compromissos assumidos, participantes citados, próximos passos, datas futuras mencionadas e localidades.`
                    : tipo === 'video'
                    ? `Transcreva o vídeo fornecido e extraia: temas principais, demandas, compromissos, participantes, próximos passos, datas futuras e localidades.`
                    : tipo === 'foto'
                    ? `Analise a imagem usando OCR e extraia: texto visível, informações relevantes, contexto, localidades mencionadas.`
                    : `Leia o documento fornecido e extraia: temas principais, demandas, compromissos, participantes, próximos passos, datas futuras e localidades.`;

                const resultado = await base44.integrations.Core.InvokeLLM({
                    prompt: prompt + `

Adicionalmente, identifique e extraia:
- Lideranças comunitárias mencionadas (nome, papel, comunidade, avaliação de interlocução se mencionado)
- Organizações mencionadas (nome, natureza, área de atuação)
- Geolocalização aproximada (coordenadas se possível identificar a localidade)`,
                    file_urls: [file_url],
                    response_json_schema: {
                        type: "object",
                        properties: {
                            transcricao: { type: "string" },
                            titulo: { type: "string" },
                            temas: { type: "array", items: { type: "string" } },
                            demandas: { type: "array", items: { type: "string" } },
                            compromissos: { type: "array", items: { type: "string" } },
                            participantes: { type: "array", items: { type: "string" } },
                            proximos_passos: { type: "array", items: { type: "string" } },
                            datas_futuras: { type: "array", items: { type: "string" } },
                            local: { type: "string" },
                            geolocalizacao: { type: "string" },
                            liderancas_identificadas: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        nome: { type: "string" },
                                        papel_na_comunidade: { type: "string" },
                                        comunidade: { type: "string" },
                                        avaliacao_interlocucao: { type: "string" }
                                    }
                                }
                            },
                            organizacoes_identificadas: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        nome: { type: "string" },
                                        natureza: { type: "string" },
                                        area_de_atuacao: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                });

                // Processar lideranças identificadas
                const liderancasIds = [];
                if (resultado.liderancas_identificadas && resultado.liderancas_identificadas.length > 0) {
                    for (const lid of resultado.liderancas_identificadas) {
                        if (lid.nome && lid.comunidade) {
                            // Verificar se liderança já existe
                            const existentes = await base44.entities.LiderancaComunitaria.list();
                            const existe = existentes.find(l => 
                                l.nome.toLowerCase().includes(lid.nome.toLowerCase()) || 
                                lid.nome.toLowerCase().includes(l.nome.toLowerCase())
                            );
                            
                            if (existe) {
                                liderancasIds.push(existe.id);
                                // Atualizar última interação
                                await base44.entities.LiderancaComunitaria.update(existe.id, {
                                    ultima_interacao: new Date().toISOString()
                                });
                            } else {
                                // Criar nova liderança
                                const novaLideranca = await base44.entities.LiderancaComunitaria.create({
                                    nome: lid.nome,
                                    comunidade: lid.comunidade,
                                    papel_na_comunidade: lid.papel_na_comunidade || "",
                                    avaliacao_interlocucao: lid.avaliacao_interlocucao || "neutro",
                                    ultima_interacao: new Date().toISOString()
                                });
                                liderancasIds.push(novaLideranca.id);
                            }
                        }
                    }
                }

                // Processar organizações identificadas
                const organizacoesIds = [];
                if (resultado.organizacoes_identificadas && resultado.organizacoes_identificadas.length > 0) {
                    for (const org of resultado.organizacoes_identificadas) {
                        if (org.nome) {
                            // Verificar se organização já existe
                            const existentes = await base44.entities.ProjetoOrganizacao.list();
                            const existe = existentes.find(o => 
                                o.nome_oficial.toLowerCase().includes(org.nome.toLowerCase()) ||
                                org.nome.toLowerCase().includes(o.nome_oficial.toLowerCase())
                            );
                            
                            if (existe) {
                                organizacoesIds.push(existe.id);
                                // Atualizar última interação
                                await base44.entities.ProjetoOrganizacao.update(existe.id, {
                                    ultima_interacao: new Date().toISOString()
                                });
                            } else {
                                // Criar nova organização
                                const novaOrg = await base44.entities.ProjetoOrganizacao.create({
                                    nome_oficial: org.nome,
                                    natureza: org.natureza || "outro",
                                    area_de_atuacao: org.area_de_atuacao || "",
                                    ultima_interacao: new Date().toISOString()
                                });
                                organizacoesIds.push(novaOrg.id);
                            }
                        }
                    }
                }

                // Criar atividade com dados extraídos e conexões
                const novaAtividade = await base44.entities.Atividade.create({
                    titulo: resultado.titulo || "Atividade registrada via " + tipo,
                    descricao: resultado.transcricao || "",
                    anexos: anexos,
                    transcricao_ia: resultado.transcricao,
                    temas_identificados: resultado.temas || [],
                    demandas: resultado.demandas || [],
                    compromissos: resultado.compromissos || [],
                    participantes: resultado.participantes || [],
                    proximos_passos: resultado.proximos_passos || [],
                    datas_futuras: resultado.datas_futuras || [],
                    local: resultado.local || "",
                    geolocalizacao: resultado.geolocalizacao || "",
                    status_etapa: "Etapa 1",
                    data: new Date().toISOString(),
                    liderancas_relacionadas: liderancasIds,
                    organizacoes_relacionadas: organizacoesIds
                });

                // Verificação ética
                const verificacaoEtica = await base44.integrations.Core.InvokeLLM({
                    prompt: `Analise o seguinte registro e identifique questões éticas:

${resultado.transcricao}

Verifique:
1. Dados pessoais excessivos (CPF, endereço completo desnecessário)
2. Conteúdos sensíveis sem consentimento
3. Falas com risco, discriminação ou exposição indevida
4. Situações de segurança
5. Violações de respeito ou conduta

Retorne lista de alertas ou lista vazia.`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            alertas: { type: "array", items: { type: "string" } }
                        }
                    }
                });

                if (verificacaoEtica.alertas && verificacaoEtica.alertas.length > 0) {
                    await base44.entities.Atividade.update(novaAtividade.id, {
                        alertas_eticos: verificacaoEtica.alertas
                    });
                }

                setLoading(false);
                navigate(createPageUrl("Etapa1") + "?id=" + novaAtividade.id);
            } else if (texto) {
                // Input de texto direto
                navigate(createPageUrl("Etapa1") + "?texto=" + encodeURIComponent(texto));
            }
        } catch (error) {
            setLoading(false);
            alert("Erro ao processar input: " + error.message);
        }
    };

    const handleTexto = () => {
        navigate(createPageUrl("Etapa1"));
    };

    const handleAudio = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.capture = 'microphone';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processarInput('audio', file);
        };
        input.click();
    };

    const handleFoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processarInput('foto', file);
        };
        input.click();
    };

    const handleVideo = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.capture = 'environment';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processarInput('video', file);
        };
        input.click();
    };

    const handleDocumento = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processarInput('documento', file);
        };
        input.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: '#F2B632' }} />
                        <h2 className="text-xl font-bold mb-2" style={{ color: '#0B1E33' }}>
                            Processando com IA...
                        </h2>
                        <p className="text-gray-600">
                            A inteligência artificial está analisando seu conteúdo, extraindo informações relevantes e verificando questões éticas.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

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
                        Registre e Escuta
                    </h1>
                </div>

                <Card style={{ borderTop: '4px solid #F2B632' }}>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>
                            Escolha como deseja registrar sua atividade
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-6">
                            A inteligência artificial processará automaticamente seu conteúdo, extraindo temas, demandas, compromissos e realizando verificações éticas.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Button
                                onClick={handleTexto}
                                size="lg"
                                variant="outline"
                                className="h-32 flex flex-col gap-3 border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: '#0B1E33' }}
                            >
                                <FileText className="w-12 h-12" style={{ color: '#F2B632' }} />
                                <span className="font-semibold" style={{ color: '#0B1E33' }}>Texto</span>
                                <span className="text-xs text-gray-500">Digite diretamente</span>
                            </Button>

                            <Button
                                onClick={handleAudio}
                                size="lg"
                                variant="outline"
                                className="h-32 flex flex-col gap-3 border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: '#0B1E33' }}
                            >
                                <Mic className="w-12 h-12" style={{ color: '#F2B632' }} />
                                <span className="font-semibold" style={{ color: '#0B1E33' }}>Áudio</span>
                                <span className="text-xs text-gray-500">Grave sua fala</span>
                            </Button>

                            <Button
                                onClick={handleFoto}
                                size="lg"
                                variant="outline"
                                className="h-32 flex flex-col gap-3 border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: '#0B1E33' }}
                            >
                                <Camera className="w-12 h-12" style={{ color: '#F2B632' }} />
                                <span className="font-semibold" style={{ color: '#0B1E33' }}>Foto</span>
                                <span className="text-xs text-gray-500">Capture imagem</span>
                            </Button>

                            <Button
                                onClick={handleVideo}
                                size="lg"
                                variant="outline"
                                className="h-32 flex flex-col gap-3 border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: '#0B1E33' }}
                            >
                                <Video className="w-12 h-12" style={{ color: '#F2B632' }} />
                                <span className="font-semibold" style={{ color: '#0B1E33' }}>Vídeo</span>
                                <span className="text-xs text-gray-500">Grave vídeo</span>
                            </Button>

                            <Button
                                onClick={handleDocumento}
                                size="lg"
                                variant="outline"
                                className="h-32 flex flex-col gap-3 border-2 hover:shadow-lg transition-all"
                                style={{ borderColor: '#0B1E33' }}
                            >
                                <Upload className="w-12 h-12" style={{ color: '#F2B632' }} />
                                <span className="font-semibold" style={{ color: '#0B1E33' }}>Documento</span>
                                <span className="text-xs text-gray-500">PDF ou DOCX</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ backgroundColor: '#DBEAFE' }}>
                    <CardContent className="pt-6">
                        <h3 className="font-bold mb-2" style={{ color: '#0B1E33' }}>
                            O que a IA faz automaticamente:
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Transcrição de áudio e vídeo
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                OCR (leitura de texto) em imagens
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Extração de temas, demandas e compromissos
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Identificação de participantes e localidades
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Detecção de datas futuras (Agenda)
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Verificação ética automática
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}