import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProcessadorDocumentos() {
    const [processando, setProcessando] = useState(false);
    const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
    const [resultados, setResultados] = useState([]);
    const queryClient = useQueryClient();

    const processarDocumentos = async (files) => {
        setProcessando(true);
        setProgresso({ atual: 0, total: files.length });
        const resultadosTemp = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Upload do arquivo
                const { file_url } = await base44.integrations.Core.UploadFile({ file });

                // Criar documento inicial
                const docInicial = await base44.entities.DocumentoProcessado.create({
                    titulo: file.name,
                    tipo: "outro",
                    arquivo_url: file_url,
                    status_processamento: "processando"
                });

                // Processar com IA
                const analise = await base44.integrations.Core.InvokeLLM({
                    prompt: `
Você é um especialista em análise documental e extração de informações estruturadas.

DOCUMENTO: ${file.name}

TAREFA COMPLETA:
1. Extraia TODO o texto do documento
2. Identifique o tipo correto (relatório, ata, política, ofício, carta, apresentação)
3. Crie um RESUMO EXECUTIVO (máximo 300 palavras)
4. Extraia INFORMAÇÕES-CHAVE (decisões, acordos, fatos relevantes)
5. Identifique PALAVRAS-CHAVE (5-10 termos importantes)
6. Identifique ENTIDADES MENCIONADAS:
   - Lideranças comunitárias (nomes de pessoas)
   - Organizações (empresas, ONGs, governo)
   - Comunidades e localidades
   - Temas principais
7. Extraia COMPROMISSOS ASSUMIDOS
8. Identifique DATAS IMPORTANTES mencionadas
9. Identifique DEMANDAS apresentadas
10. Identifique possíveis RISCOS SOCIAIS mencionados
11. Crie um ÍNDICE PESQUISÁVEL estruturado por seções

Seja exaustivo e preciso na extração.
`,
                    file_urls: [file_url],
                    response_json_schema: {
                        type: "object",
                        properties: {
                            conteudo_completo: { type: "string" },
                            tipo_documento: { 
                                type: "string",
                                enum: ["relatorio", "ata", "politica", "oficio", "carta", "apresentacao", "outro"]
                            },
                            resumo_executivo: { type: "string" },
                            informacoes_chave: { type: "array", items: { type: "string" } },
                            palavras_chave: { type: "array", items: { type: "string" } },
                            entidades_mencionadas: {
                                type: "object",
                                properties: {
                                    liderancas: { type: "array", items: { type: "string" } },
                                    organizacoes: { type: "array", items: { type: "string" } },
                                    comunidades: { type: "array", items: { type: "string" } },
                                    temas: { type: "array", items: { type: "string" } }
                                }
                            },
                            compromissos: { type: "array", items: { type: "string" } },
                            datas_importantes: { type: "array", items: { type: "string" } },
                            demandas: { type: "array", items: { type: "string" } },
                            riscos: { type: "array", items: { type: "string" } },
                            data_documento: { type: "string" },
                            origem: { type: "string" },
                            indice: {
                                type: "object",
                                properties: {
                                    secoes: { type: "array", items: { type: "string" } },
                                    topicos_principais: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                });

                // Buscar referências cruzadas
                const referencias = [];
                
                // Conectar com lideranças existentes
                if (analise.entidades_mencionadas?.liderancas) {
                    const liderancas = await base44.entities.LiderancaComunitaria.list();
                    for (const lidNome of analise.entidades_mencionadas.liderancas) {
                        const encontrada = liderancas.find(l => 
                            l.nome.toLowerCase().includes(lidNome.toLowerCase()) ||
                            lidNome.toLowerCase().includes(l.nome.toLowerCase())
                        );
                        if (encontrada) {
                            referencias.push({
                                tipo: "lideranca",
                                id: encontrada.id,
                                descricao: `Liderança: ${encontrada.nome}`
                            });
                        }
                    }
                }

                // Conectar com organizações existentes
                if (analise.entidades_mencionadas?.organizacoes) {
                    const organizacoes = await base44.entities.ProjetoOrganizacao.list();
                    for (const orgNome of analise.entidades_mencionadas.organizacoes) {
                        const encontrada = organizacoes.find(o => 
                            o.nome_oficial.toLowerCase().includes(orgNome.toLowerCase()) ||
                            orgNome.toLowerCase().includes(o.nome_oficial.toLowerCase())
                        );
                        if (encontrada) {
                            referencias.push({
                                tipo: "organizacao",
                                id: encontrada.id,
                                descricao: `Organização: ${encontrada.nome_oficial}`
                            });
                        }
                    }
                }

                // Conectar com riscos existentes
                if (analise.riscos && analise.riscos.length > 0) {
                    const riscos = await base44.entities.RiscoSocial.list();
                    for (const riscoTexto of analise.riscos) {
                        const encontrado = riscos.find(r => 
                            r.titulo.toLowerCase().includes(riscoTexto.toLowerCase()) ||
                            riscoTexto.toLowerCase().includes(r.titulo.toLowerCase())
                        );
                        if (encontrado) {
                            referencias.push({
                                tipo: "risco",
                                id: encontrado.id,
                                descricao: `Risco: ${encontrado.titulo}`
                            });
                        }
                    }
                }

                // Atualizar documento com análise completa
                await base44.entities.DocumentoProcessado.update(docInicial.id, {
                    tipo: analise.tipo_documento,
                    conteudo_extraido: analise.conteudo_completo,
                    resumo: analise.resumo_executivo,
                    palavras_chave: analise.palavras_chave || [],
                    entidades_mencionadas: analise.entidades_mencionadas || {},
                    informacoes_chave: analise.informacoes_chave || [],
                    compromissos_identificados: analise.compromissos || [],
                    datas_importantes: analise.datas_importantes || [],
                    demandas_identificadas: analise.demandas || [],
                    riscos_identificados: analise.riscos || [],
                    data_documento: analise.data_documento || null,
                    origem: analise.origem || "Não especificada",
                    status_processamento: "concluido",
                    referencias_cruzadas: referencias,
                    indice_pesquisavel: analise.indice || {}
                });

                resultadosTemp.push({
                    arquivo: file.name,
                    status: "sucesso",
                    id: docInicial.id
                });

            } catch (error) {
                console.error(`Erro ao processar ${file.name}:`, error);
                resultadosTemp.push({
                    arquivo: file.name,
                    status: "erro",
                    mensagem: error.message
                });
            }

            setProgresso({ atual: i + 1, total: files.length });
        }

        setResultados(resultadosTemp);
        setProcessando(false);
        queryClient.invalidateQueries({ queryKey: ['documentos'] });
    };

    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.doc,.docx,.txt';
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                processarDocumentos(files);
            }
        };
        input.click();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Processamento Inteligente de Documentos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Faça upload de múltiplos documentos (PDF, DOCX, TXT) para análise automática em lote. 
                    A IA extrairá informações-chave, identificará tendências, criará resumos e indexará o conteúdo.
                </p>

                {!processando && resultados.length === 0 && (
                    <Button
                        onClick={handleFileSelect}
                        className="w-full"
                        size="lg"
                        style={{ backgroundColor: '#F2B632', color: '#0B1E33' }}
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Selecionar Documentos para Processar
                    </Button>
                )}

                {processando && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-sm font-medium">
                                Processando documento {progresso.atual} de {progresso.total}...
                            </span>
                        </div>
                        <Progress value={(progresso.atual / progresso.total) * 100} />
                        <p className="text-xs text-gray-500">
                            Extraindo texto, analisando conteúdo e criando referências cruzadas...
                        </p>
                    </div>
                )}

                {resultados.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Resultados do Processamento:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {resultados.map((resultado, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-2 p-2 rounded ${
                                        resultado.status === "sucesso" ? "bg-green-50" : "bg-red-50"
                                    }`}
                                >
                                    {resultado.status === "sucesso" ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    )}
                                    <span className="text-sm flex-1">{resultado.arquivo}</span>
                                    {resultado.status === "erro" && (
                                        <span className="text-xs text-red-600">{resultado.mensagem}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => {
                                setResultados([]);
                                handleFileSelect();
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Processar Mais Documentos
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}