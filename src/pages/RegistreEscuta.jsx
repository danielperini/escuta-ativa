import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, Camera, Video, FileText, Upload, Loader2 } from "lucide-react";
import GravadorAudio from "../components/audio/GravadorAudio";
import RevisaoTranscricao from "../components/audio/RevisaoTranscricao";
import DetectorContinuidade from "../components/continuidade/DetectorContinuidade";

export default function RegistreEscuta() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tipoInput, setTipoInput] = useState(null);
    const [dadosRevisao, setDadosRevisao] = useState(null);
    const [verificandoContinuidade, setVerificandoContinuidade] = useState(false);
    const [atividadeParaContinuidade, setAtividadeParaContinuidade] = useState(null);

    const processarInput = async (tipo, file = null, texto = null, metadados = null) => {
        setLoading(true);

        try {
            let transcricao = "";
            let anexos = [];
            let metadadosCompletos = metadados || {};

            if (file) {
                // Upload do arquivo
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                anexos.push(file_url);

                // Adicionar metadados do arquivo
                metadadosCompletos = {
                    ...metadadosCompletos,
                    arquivo_url: file_url,
                    nome_arquivo: file.name,
                    tamanho: file.size,
                    tipo: file.type
                };

                // Processar com IA - PROCESSAMENTO UNIVERSAL ROBUSTO
                let prompt = "";

                if (tipo === 'audio') {
                    prompt = `ÁUDIO - Transcrição completa e extração estruturada:
                1. Transcreva TODA a fala do áudio (reconhecimento automático de fala)
                2. Identifique locutor(es) quando possível
                3. Extraia: temas principais, demandas explícitas, compromissos assumidos, participantes citados, próximos passos, datas futuras mencionadas, localidades/endereços.
                4. Identifique sinais de risco, tensão ou oportunidade.
                5. Classifique emoção/tom e sentimento predominante (neutro, irritado, urgente, preocupado, satisfeito, tenso, calmo)

                ANÁLISE COMPLEMENTAR OBRIGATÓRIA:
                6. TIPO DE REGISTRO - Identifique automaticamente qual tipo se aplica:
                   - "reuniao" (múltiplos participantes, discussão coletiva, pauta estruturada)
                   - "conversa_de_campo" (diálogo informal no território)
                   - "visita" (inspeção, observação, levantamento)
                   - "visita_institucional" (reunião formal com autoridades/organizações)
                   - "dialogo_individualizado" (conversa 1-1 ou relato individual)

                7. ACIONAMENTOS SUGERIDOS - Com base no conteúdo, urgência e risco, sugira:
                   - "visita_tecnica" (se houver problema estrutural, técnico ou que exija verificação in loco)
                   - "comunicacao_institucional" (se exigir resposta oficial, posicionamento ou esclarecimento)
                   - "reuniao_emergencial" (se for crítico e urgente)
                   - "monitoramento_continuo" (se for risco latente)
                   - "nenhum" (se for informativo apenas)`;
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
                            transcricao_estruturada: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        locutor: { type: "string" },
                                        texto: { type: "string" },
                                        timestamp: { type: "string" },
                                        emocao: { type: "string" }
                                    }
                                }
                            },
                            titulo: { type: "string" },
                            tipo_registro_sugerido: {
                                type: "string",
                                enum: ["reuniao", "conversa_de_campo", "visita", "visita_institucional", "dialogo_individualizado"]
                            },
                            justificativa_tipo: { type: "string" },
                            sentimento_predominante: {
                                type: "string",
                                enum: ["neutro", "irritado", "urgente", "preocupado", "satisfeito", "tenso", "calmo"]
                            },
                            nivel_urgencia: {
                                type: "string",
                                enum: ["baixo", "moderado", "alto", "critico"]
                            },
                            acionamentos_sugeridos: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        tipo: {
                                            type: "string",
                                            enum: ["visita_tecnica", "comunicacao_institucional", "reuniao_emergencial", "monitoramento_continuo", "nenhum"]
                                        },
                                        justificativa: { type: "string" },
                                        prazo_sugerido: { type: "string" }
                                    }
                                }
                            },
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
                            },
                            materialidade_identificada: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        tema: { type: "string" },
                                        relevancia_comunidade: { type: "number" },
                                        relevancia_empresa: { type: "number" }
                                    }
                                }
                            },
                            agenda_futura: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        titulo: { type: "string" },
                                        data: { type: "string" },
                                        tipo: { type: "string" }
                                    }
                                }
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

                // Processar lideranças identificadas - COM VERIFICAÇÃO DE DUPLICATAS
                const liderancasIds = [];
                if (resultado.liderancas_identificadas && resultado.liderancas_identificadas.length > 0) {
                    const usuario = await base44.auth.me();

                    for (const lid of resultado.liderancas_identificadas) {
                        if (lid.nome && lid.comunidade) {
                            // Verificação RIGOROSA de duplicatas com IA
                            const existentes = await base44.entities.LiderancaComunitaria.list();

                            const verificacao = await base44.integrations.Core.InvokeLLM({
                                prompt: `
                Verifique se esta liderança já existe no sistema:

                NOVO: ${JSON.stringify(lid)}
                EXISTENTES: ${JSON.stringify(existentes)}

                Aplique fuzzy matching rigoroso em nome, telefone, comunidade.
                Retorne o ID se encontrar duplicata, ou null se for novo.`,
                                response_json_schema: {
                                    type: "object",
                                    properties: {
                                        duplicata_encontrada: { type: "boolean" },
                                        id_existente: { type: "string" }
                                    }
                                }
                            });

                            if (verificacao.duplicata_encontrada && verificacao.id_existente) {
                                liderancasIds.push(verificacao.id_existente);
                                await base44.entities.LiderancaComunitaria.update(verificacao.id_existente, {
                                    ultima_interacao: new Date().toISOString()
                                });
                            } else {
                                // CRIAR APENAS SE APROVADO - registrar para auditoria
                                const novaLideranca = await base44.entities.LiderancaComunitaria.create({
                                    nome: lid.nome,
                                    comunidade: lid.comunidade,
                                    papel_na_comunidade: lid.papel_na_comunidade || "",
                                    avaliacao_interlocucao: lid.avaliacao_interlocucao || "neutro",
                                    ultima_interacao: new Date().toISOString(),
                                    historico_auditoria: [{
                                        campo_alterado: 'Criação automática via IA',
                                        valor_anterior: null,
                                        valor_novo: 'Identificado em registro',
                                        data_alteracao: new Date().toISOString(),
                                        usuario_responsavel: usuario.email,
                                        tipo_operacao: 'criacao',
                                        aprovacao_necessaria: false,
                                        fonte_origem: 'Processamento de áudio/documento'
                                    }]
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

                // Processar organizações identificadas - COM VERIFICAÇÃO DE DUPLICATAS
                const organizacoesIds = [];
                if (resultado.organizacoes_identificadas && resultado.organizacoes_identificadas.length > 0) {
                    const usuario = await base44.auth.me();

                    for (const org of resultado.organizacoes_identificadas) {
                        if (org.nome) {
                            const existentes = await base44.entities.ProjetoOrganizacao.list();

                            const verificacao = await base44.integrations.Core.InvokeLLM({
                                prompt: `
                Verifique se esta organização já existe:

                NOVO: ${JSON.stringify(org)}
                EXISTENTES: ${JSON.stringify(existentes)}

                Fuzzy matching em nome_oficial, CNPJ, telefone.
                Retorne ID se duplicata ou null.`,
                                response_json_schema: {
                                    type: "object",
                                    properties: {
                                        duplicata_encontrada: { type: "boolean" },
                                        id_existente: { type: "string" }
                                    }
                                }
                            });

                            if (verificacao.duplicata_encontrada && verificacao.id_existente) {
                                organizacoesIds.push(verificacao.id_existente);
                                await base44.entities.ProjetoOrganizacao.update(verificacao.id_existente, {
                                    ultima_interacao: new Date().toISOString()
                                });
                            } else {
                                const novaOrg = await base44.entities.ProjetoOrganizacao.create({
                                    nome_oficial: org.nome,
                                    natureza: org.natureza || "outro",
                                    area_de_atuacao: org.area_de_atuacao || "",
                                    ultima_interacao: new Date().toISOString(),
                                    historico_auditoria: [{
                                        campo_alterado: 'Criação automática via IA',
                                        valor_anterior: null,
                                        valor_novo: 'Identificado em registro',
                                        data_alteracao: new Date().toISOString(),
                                        usuario_responsavel: usuario.email,
                                        tipo_operacao: 'criacao',
                                        fonte_origem: 'Processamento automático'
                                    }]
                                });
                                organizacoesIds.push(novaOrg.id);
                            }
                        }
                    }
                }

                // Processar materialidade identificada
                if (resultado.materialidade_identificada && resultado.materialidade_identificada.length > 0) {
                    for (const mat of resultado.materialidade_identificada) {
                        if (mat.tema) {
                            const temaExistente = await base44.entities.Tema.list();
                            const existe = temaExistente.find(t => 
                                t.nome.toLowerCase() === mat.tema.toLowerCase()
                            );

                            if (!existe) {
                                await base44.entities.Tema.create({
                                    nome: mat.tema,
                                    categoria: "social",
                                    relevancia_comunidade: mat.relevancia_comunidade || 5,
                                    relevancia_empresa: mat.relevancia_empresa || 5,
                                    mencoes_total: 1,
                                    ultima_mencao: new Date().toISOString().split('T')[0]
                                });
                            }
                        }
                    }
                }

                // Processar agenda futura
                const agendasCriadas = [];
                if (resultado.agenda_futura && resultado.agenda_futura.length > 0) {
                    for (const ag of resultado.agenda_futura) {
                        if (ag.titulo && ag.data) {
                            const novaAgenda = await base44.entities.Agenda.create({
                                titulo: ag.titulo,
                                data: ag.data,
                                tipo: ag.tipo || "reuniao",
                                status: "prevista",
                                comunidade: resultado.local || "A definir"
                            });
                            agendasCriadas.push(novaAgenda.id);
                        }
                    }
                }

                // Detectar se demanda requer devolutiva
                const requerDevolutiva = resultado.demandas && resultado.demandas.length > 0;
                const prazoDevolutiva = new Date();
                prazoDevolutiva.setDate(prazoDevolutiva.getDate() + 15);

                // Detectar encaminhamento na fala
                const deteccaoEncaminhamento = await base44.integrations.Core.InvokeLLM({
                    prompt: `
                Analise se há menção de ENCAMINHAMENTO neste registro:

                "${resultado.transcricao}"

                Procure por frases como:
                - "Encaminhei para a empresa"
                - "Solicitei retorno"
                - "A demanda foi enviada"
                - "Vou repassar"
                - "Vou levar ao setor"

                Retorne se há encaminhamento e detalhes.`,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            encaminhamento_detectado: { type: "boolean" },
                            detalhes: { type: "string" }
                        }
                    }
                });

                // Criar atividade com dados extraídos e conexões
                const novaAtividade = await base44.entities.Atividade.create({
                    titulo: resultado.titulo || "Atividade registrada via " + tipo,
                    tipo: resultado.tipo_registro_sugerido || "conversa_de_campo",
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
                    organizacoes_relacionadas: organizacoesIds,
                    demanda_requer_devolutiva: requerDevolutiva,
                    status_devolutiva: requerDevolutiva ? 'pendente' : 'nao_requerida',
                    prazo_devolutiva: requerDevolutiva ? prazoDevolutiva.toISOString().split('T')[0] : null,
                    encaminhamento_realizado: deteccaoEncaminhamento.encaminhamento_detectado,
                    detalhes_encaminhamento: deteccaoEncaminhamento.detalhes || null,
                    data_encaminhamento: deteccaoEncaminhamento.encaminhamento_detectado ? new Date().toISOString() : null,
                    linha_tempo_demanda: [{
                        data: new Date().toISOString(),
                        evento: 'Demanda registrada',
                        registro_id: null
                    }]
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
                // Verificar continuidade ANTES de finalizar
                setAtividadeParaContinuidade({
                    id: novaAtividade.id,
                    titulo: novaAtividade.titulo,
                    local: novaAtividade.local,
                    temas_identificados: novaAtividade.temas_identificados,
                    liderancas_relacionadas: liderancasIds,
                    demandas: novaAtividade.demandas
                });
                setVerificandoContinuidade(true);
                setLoading(false);

                return;
            } else if (texto) {
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

    const handleAudioFinalizado = (audioFile, metadados) => {
        processarInput('audio', audioFile, null, metadados);
        setTipoInput(null);
    };

    const confirmarRevisao = async (dadosConfirmados) => {
        setLoading(true);
        try {
            await base44.entities.Atividade.update(dadosRevisao.atividadeId, {
                titulo: dadosConfirmados.titulo,
                local: dadosConfirmados.local,
                temas_identificados: dadosConfirmados.temas,
                demandas: dadosConfirmados.demandas
            });

            // Mostrar mensagem de sucesso
            setLoading(false);
            setDadosRevisao(null);
            
            // Exibir confirmação visual
            const divSucesso = document.createElement('div');
            divSucesso.className = 'registro-finalizado-overlay';
            divSucesso.innerHTML = `
                <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9998;"></div>
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                            background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            z-index: 9999; text-align: center; min-width: 400px; max-width: 90vw;">
                    <div style="width: 80px; height: 80px; background: #22c55e; border-radius: 50%; 
                                margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
                                animation: scaleIn 0.5s ease-out;">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style="color: #0B1E33; font-size: 24px; font-weight: bold; margin-bottom: 12px;">
                        ✓ Registro Finalizado com Sucesso!
                    </h2>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
                        Seu registro foi salvo e processado pela IA.
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">
                        Todas as conexões foram estabelecidas automaticamente.
                    </p>
                </div>
                <style>
                    @keyframes scaleIn {
                        from { transform: scale(0); }
                        to { transform: scale(1); }
                    }
                </style>
            `;
            document.body.appendChild(divSucesso);

            setTimeout(() => {
                document.body.removeChild(divSucesso);
                // Verificar continuidade após confirmar revisão
          setAtividadeParaContinuidade({
              id: dadosRevisao.atividadeId,
              titulo: dadosConfirmados.titulo,
              local: dadosConfirmados.local,
              temas_identificados: dadosConfirmados.temas,
              demandas: dadosConfirmados.demandas
          });
          setVerificandoContinuidade(true);
          setDadosRevisao(null);
            }, 2500);

        } catch (error) {
            setLoading(false);
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

    if (verificandoContinuidade && atividadeParaContinuidade) {
        return (
            <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setVerificandoContinuidade(false);
                                setAtividadeParaContinuidade(null);
                            }}
                            style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                        <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                            Verificação de Continuidade
                        </h1>
                    </div>

                    <DetectorContinuidade
                        atividadeNova={atividadeParaContinuidade}
                        onVincular={async (registrosAnteriores) => {
                            // Vincular registros
                            const usuario = await base44.auth.me();

                            for (const regId of registrosAnteriores) {
                                const regAnterior = await base44.entities.Atividade.list();
                                const reg = regAnterior.find(r => r.id === regId);

                                // Atualizar registro anterior
                                await base44.entities.Atividade.update(regId, {
                                    registros_continuidade: [
                                        ...(reg.registros_continuidade || []),
                                        atividadeParaContinuidade.id
                                    ],
                                    linha_tempo_demanda: [
                                        ...(reg.linha_tempo_demanda || []),
                                        {
                                            data: new Date().toISOString(),
                                            evento: 'Registro de continuidade vinculado',
                                            registro_id: atividadeParaContinuidade.id
                                        }
                                    ]
                                });
                            }

                            // Atualizar novo registro
                            await base44.entities.Atividade.update(atividadeParaContinuidade.id, {
                                registro_origem_continuidade: registrosAnteriores[0]
                            });

                            alert('✓ Continuidade registrada com sucesso!');
                            navigate(createPageUrl("Etapa1") + "?id=" + atividadeParaContinuidade.id);
                        }}
                        onIgnorar={() => {
                            navigate(createPageUrl("Etapa1") + "?id=" + atividadeParaContinuidade.id);
                        }}
                    />
                </div>
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
                            🎙️ Processamento Avançado de Áudio:
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Gravação nativa</strong> com pausar/retomar/finalizar
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Metadados automáticos</strong>: data, hora, localização GPS, duração
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Transcrição avançada</strong>: identificação de locutores, pausas, pontuação
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Correção ortográfica</strong> e detecção de nomes próprios
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Análise de sentimento</strong>: irritação, urgência, calma
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Classificação automática</strong> do tipo de registro
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Extração estruturada</strong>: temas, demandas, compromissos, riscos
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Conexões automáticas</strong>: Lideranças, Organizações, Comunidades
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Agenda futura</strong>: datas mencionadas → compromissos
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Materialidade</strong>: identifica temas de alta relevância
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Tela de revisão</strong> antes de salvar com edição completa
                            </li>
                            <li className="flex gap-2">
                                <span style={{ color: '#F2B632' }}>✓</span>
                                <strong>Formatos suportados</strong>: MP3, WAV, OGG, M4A, WebM
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