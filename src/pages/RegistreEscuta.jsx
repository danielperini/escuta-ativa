import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, Camera, Video, FileText, Upload, Loader2 } from "lucide-react";
import GravadorAudio from "../components/audio/GravadorAudio";
import RevisaoTranscricao from "../components/audio/RevisaoTranscricao";

export default function RegistreEscuta() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tipoInput, setTipoInput] = useState(null);
    const [dadosRevisao, setDadosRevisao] = useState(null);

    const processarInput = async (tipo, file = null, texto = null) => {
        setLoading(true);

        try {
            let transcricao = "";
            let anexos = [];

            if (file) {
                // Upload do arquivo
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                anexos.push(file_url);

                // Processar com IA - PROCESSAMENTO UNIVERSAL ROBUSTO
                let prompt = "";

                if (tipo === 'audio') {
                    prompt = `ÁUDIO - Transcrição completa e extração estruturada:
                1. Transcreva TODA a fala do áudio (reconhecimento automático de fala)
                2. Identifique locutor(es) quando possível
                3. Extraia: temas principais, demandas explícitas, compromissos assumidos, participantes citados, próximos passos, datas futuras mencionadas, localidades/endereços.
                4. Identifique sinais de risco, tensão ou oportunidade.
                5. Classifique emoção/tom (neutro, preocupado, satisfeito, tenso, etc)`;
                } else if (tipo === 'video') {
                    prompt = `VÍDEO - Transcrição completa de áudio + análise visual:
                1. Transcreva TODA a fala presente no vídeo
                2. Aplique OCR em textos visíveis (placas, cartazes, documentos)
                3. Identifique local aproximado por contexto visual
                4. Extraia: temas, demandas, compromissos, participantes, próximos passos, datas futuras, localidades
                5. Identifique evidências visuais de impactos (poeira, barulho, obras, riscos ambientais, etc)`;
                } else if (tipo === 'foto') {
                    prompt = `FOTO/IMAGEM - OCR completo + análise contextual:
                1. Aplique OCR rigoroso em todo texto visível (placas, ruas, cartazes, documentos, manuscritos)
                2. Identifique nomes de ruas, bairros, comunidades, marcos visuais
                3. Classifique evidências presentes (poeira, barulho visual, obras, riscos, oportunidades)
                4. Extraia informações relevantes, contexto territorial, localidades
                5. Identifique pessoas, eventos, situações de risco ou oportunidade`;
                } else {
                    prompt = `DOCUMENTO (.pdf, .docx, .txt, imagem convertida) - Leitura total e extração:
                1. Leia e extraia TODO o conteúdo textual do documento
                2. Identifique estrutura (carta, ata, ofício, lista, etc)
                3. Extraia: temas principais, demandas explícitas, compromissos, participantes/signatários, prazos, datas futuras, localidades/endereços
                4. Identifique lideranças comunitárias, organizações, representantes de poder público
                5. Classifique relevância e urgência`;
                }

                // Tentar reprocessar até 3 vezes em caso de falha
                let resultado = null;
                let tentativas = 0;

                while (!resultado && tentativas < 3) {
                    try {
                        tentativas++;
                        resultado = await base44.integrations.Core.InvokeLLM({
                            prompt: prompt + `

                EXTRAÇÃO OBRIGATÓRIA ADICIONAL:
- Lideranças comunitárias mencionadas (nome, papel, comunidade, avaliação de interlocução)
- Organizações mencionadas (nome oficial, natureza, área de atuação)
- Geolocalização aproximada (coordenadas ou endereço completo se identificável)
- Riscos sociais implícitos ou explícitos
- Oportunidades estratégicas (artistas, fornecedores, projetos, iniciativas)
- Sentimento/emoção predominante

IMPORTANTE: Se algum campo não puder ser extraído, retorne vazio ou null. Não invente dados. Baseie-se apenas no conteúdo fornecido.`,
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
                            },
                            riscos_identificados: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        titulo: { type: "string" },
                                        nivel: { type: "string" },
                                        tipo: { type: "string" }
                                    }
                                }
                            },
                            oportunidades_identificadas: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        titulo: { type: "string" },
                                        tipo: { type: "string" },
                                        relevancia: { type: "string" }
                                    }
                                }
                            },
                            sentimento: { 
                                type: "string",
                                enum: ["neutro", "positivo", "preocupado", "tenso", "satisfeito", "insatisfeito"]
                            }
                        }
                        }
                        });
                        } catch (error) {
                        console.error(`Tentativa ${tentativas} falhou:`, error);
                        if (tentativas === 3) {
                        throw new Error("Falha ao processar mídia após 3 tentativas");
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                        }

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

                // Processar riscos identificados
                if (resultado.riscos_identificados && resultado.riscos_identificados.length > 0) {
                    for (const risco of resultado.riscos_identificados) {
                        if (risco.titulo && risco.nivel && risco.tipo) {
                            await base44.entities.RiscoSocial.create({
                                titulo: risco.titulo,
                                nivel: risco.nivel,
                                tipo: risco.tipo,
                                comunidade: resultado.local || "A definir",
                                descricao: "Identificado automaticamente via IA",
                                geolocalizacao: resultado.geolocalizacao || "",
                                status: "ativo"
                            });
                        }
                    }
                }

                // Processar oportunidades identificadas
                if (resultado.oportunidades_identificadas && resultado.oportunidades_identificadas.length > 0) {
                    for (const opo of resultado.oportunidades_identificadas) {
                        if (opo.titulo && opo.tipo) {
                            await base44.entities.Oportunidade.create({
                                titulo: opo.titulo,
                                tipo: opo.tipo,
                                relevancia: opo.relevancia || "media",
                                comunidade: resultado.local || "A definir",
                                descricao: "Identificada automaticamente via IA",
                                origem: "Registro automático",
                                maturidade: "ideia"
                            });
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

                // Se for áudio, mostrar tela de revisão
                if (tipo === 'audio') {
                    setDadosRevisao({
                        audioUrl: anexos[0],
                        transcricao: resultado.transcricao,
                        interpretacao: {
                            titulo: resultado.titulo,
                            local: resultado.local,
                            temas: resultado.temas,
                            demandas: resultado.demandas,
                            compromissos: resultado.compromissos,
                            participantes: resultado.participantes,
                            sentimento: resultado.sentimento,
                            risco_identificado: resultado.riscos_identificados && resultado.riscos_identificados.length > 0 
                                ? { nivel: "moderado", descricao: resultado.riscos_identificados[0].titulo }
                                : null
                        },
                        atividadeId: novaAtividade.id
                    });
                    setLoading(false);
                } else {
                    setLoading(false);
                    navigate(createPageUrl("Etapa1") + "?id=" + novaAtividade.id);
                }
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
        setTipoInput('audio');
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
        input.accept = '.pdf,.doc,.docx,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) processarInput('documento', file);
        };
        input.click();
    };

    const handleAudioFinalizado = (audioFile) => {
        processarInput('audio', audioFile);
        setTipoInput(null);
    };

    const confirmarRevisao = async (dadosConfirmados) => {
        try {
            await base44.entities.Atividade.update(dadosRevisao.atividadeId, {
                titulo: dadosConfirmados.titulo,
                local: dadosConfirmados.local,
                temas_identificados: dadosConfirmados.temas,
                demandas: dadosConfirmados.demandas
            });

            navigate(createPageUrl("Etapa1") + "?id=" + dadosRevisao.atividadeId);
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        }
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

    if (dadosRevisao) {
        return (
            <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setDadosRevisao(null)}
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Revisão de Transcrição
                        </h1>
                    </div>

                    <RevisaoTranscricao
                        audioUrl={dadosRevisao.audioUrl}
                        transcricao={dadosRevisao.transcricao}
                        interpretacao={dadosRevisao.interpretacao}
                        onConfirmar={confirmarRevisao}
                    />
                </div>
            </div>
        );
    }

    if (tipoInput === 'audio') {
        return (
            <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setTipoInput(null)}
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Gravar Áudio
                        </h1>
                    </div>

                    <GravadorAudio onAudioFinalizado={handleAudioFinalizado} />

                    <Card style={{ backgroundColor: '#DBEAFE' }}>
                        <CardContent className="pt-6">
                            <h3 className="font-bold mb-2" style={{ color: '#0B1E33' }}>
                                Você também pode anexar áudio externo:
                            </h3>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*';
                                    input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (file) handleAudioFinalizado(file);
                                    };
                                    input.click();
                                }}
                                className="w-full"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Enviar arquivo de áudio (MP3, WAV, OGG, M4A)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
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
                        Registre Escuta
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
                                <span className="text-xs text-gray-500">Grave ou envie áudio</span>
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
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Gravação de áudio nativa com controles
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Suporte a MP3, WAV, OGG, M4A
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                Revisão antes de salvar
                            </li>
                            </ul>
                            </CardContent>
                            </Card>

                            <Card style={{ backgroundColor: '#FEF3C7' }}>
                            <CardContent className="pt-6">
                            <h3 className="font-bold mb-2" style={{ color: '#0B1E33' }}>
                            ⚠️ Fotos e vídeos:
                            </h3>
                            <p className="text-sm text-gray-700">
                            Fotos e vídeos são anexados apenas como <strong>evidências</strong>. Nenhuma análise visual é feita pela IA. 
                            Toda interpretação vem do texto, áudio transcrito ou documentos processados.
                            </p>
                            </CardContent>
                            </Card>
                            </div>
                            </div>
                            );
                            }