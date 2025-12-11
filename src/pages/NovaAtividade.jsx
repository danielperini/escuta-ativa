import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Camera, Video, Save, ArrowLeft, Loader2 } from "lucide-react";

export default function NovaAtividade() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        categoria: "",
        origem: "",
        descricao: "",
        data_atividade: "",
        local: "",
        participantes: "",
        observacoes: ""
    });
    const [anexos, setAnexos] = useState([]);

    const handleCapturarFoto = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                setLoading(true);
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setAnexos([...anexos, { url: file_url, tipo: 'foto' }]);
                setLoading(false);
            }
        };
        input.click();
    };

    const handleGravarVideo = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.capture = 'environment';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                setLoading(true);
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                setAnexos([...anexos, { url: file_url, tipo: 'video' }]);
                setLoading(false);
            }
        };
        input.click();
    };

    const handleSalvar = async () => {
        if (!formData.categoria || !formData.descricao) {
            alert("Por favor, preencha os campos obrigatórios");
            return;
        }

        setLoading(true);

        // Processar com IA se houver anexos
        let transcricao = null;
        if (anexos.length > 0) {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Analise o conteúdo da imagem/vídeo e extraia informações relevantes para um registro de atividade comunitária. Identifique pessoas, locais, assuntos discutidos e pontos importantes.`,
                file_urls: anexos.map(a => a.url)
            });
            transcricao = response;
        }

        // Verificação ética com IA
        const verificacaoEtica = await base44.integrations.Core.InvokeLLM({
            prompt: `Analise o seguinte registro de atividade comunitária e identifique possíveis questões éticas:
            
Descrição: ${formData.descricao}
Observações: ${formData.observacoes}

Verifique se há:
1. Dados pessoais excessivos (CPF, endereço completo desnecessário)
2. Conteúdos sensíveis mencionados sem consentimento
3. Falas que indiquem risco, discriminação ou exposição indevida
4. Situações de segurança
5. Violações a princípios de respeito ou conduta

Retorne uma lista de alertas, ou uma lista vazia se não houver problemas.`,
            response_json_schema: {
                type: "object",
                properties: {
                    alertas: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        await base44.entities.Atividade.create({
            ...formData,
            anexos: anexos.map(a => a.url),
            transcricao_ia: transcricao,
            alertas_eticos: verificacaoEtica.alertas || []
        });

        setLoading(false);
        alert("Atividade registrada com sucesso!");
        navigate(createPageUrl("Atividades"));
    };

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
                        + Escuta Ativa
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>Capturar Mídia</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button
                            onClick={handleCapturarFoto}
                            disabled={loading}
                            style={{ backgroundColor: '#F2B632' }}
                            className="text-white"
                        >
                            <Camera className="w-5 h-5 mr-2" />
                            Abrir Câmera (Foto)
                        </Button>
                        <Button
                            onClick={handleGravarVideo}
                            disabled={loading}
                            style={{ backgroundColor: '#0B1E33' }}
                            className="text-white"
                        >
                            <Video className="w-5 h-5 mr-2" />
                            Gravar Vídeo
                        </Button>
                    </CardContent>
                </Card>

                {anexos.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ color: '#0B1E33' }}>Arquivos Anexados ({anexos.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {anexos.map((anexo, index) => (
                                    <div key={index} className="relative">
                                        {anexo.tipo === 'foto' ? (
                                            <img src={anexo.url} alt="Anexo" className="w-full h-32 object-cover rounded" />
                                        ) : (
                                            <video src={anexo.url} className="w-full h-32 object-cover rounded" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle style={{ color: '#0B1E33' }}>Informações da Atividade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Categoria *
                            </label>
                            <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Reuniões">Reuniões</SelectItem>
                                    <SelectItem value="Diálogos espontâneos">Diálogos espontâneos</SelectItem>
                                    <SelectItem value="Demandas recebidas por WhatsApp">Demandas recebidas por WhatsApp</SelectItem>
                                    <SelectItem value="Telefonemas">Telefonemas</SelectItem>
                                    <SelectItem value="Ocorrências gerais">Ocorrências gerais</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Origem
                            </label>
                            <Select value={formData.origem} onValueChange={(value) => setFormData({...formData, origem: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a origem" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Comunidade">Comunidade</SelectItem>
                                    <SelectItem value="Poder Público">Poder Público</SelectItem>
                                    <SelectItem value="Organização da Sociedade Civil">Organização da Sociedade Civil</SelectItem>
                                    <SelectItem value="Empresa">Empresa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Descrição *
                            </label>
                            <Textarea
                                placeholder="Descreva a atividade..."
                                value={formData.descricao}
                                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                    Data da Atividade
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={formData.data_atividade}
                                    onChange={(e) => setFormData({...formData, data_atividade: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                    Local
                                </label>
                                <Input
                                    placeholder="Local da atividade"
                                    value={formData.local}
                                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Participantes
                            </label>
                            <Input
                                placeholder="Liste os participantes"
                                value={formData.participantes}
                                onChange={(e) => setFormData({...formData, participantes: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: '#0B1E33' }}>
                                Observações
                            </label>
                            <Textarea
                                placeholder="Observações adicionais..."
                                value={formData.observacoes}
                                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                                className="min-h-[100px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSalvar}
                        disabled={loading}
                        size="lg"
                        className="text-white font-semibold px-12 py-6 rounded-xl"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Salvar Atividade
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}