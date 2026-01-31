import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Image, Music, Video, AlertTriangle, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProcessadorClaudeIA({ onRegistroCriado, context = {} }) {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [missingFieldsDialog, setMissingFieldsDialog] = useState(false);
    const [missingFieldsData, setMissingFieldsData] = useState({});

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Verificar tamanho (limite 50MB)
            if (selectedFile.size > 50 * 1024 * 1024) {
                toast.error('Arquivo muito grande. Limite: 50MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const processFile = async () => {
        if (!file) {
            toast.error('Selecione um arquivo');
            return;
        }

        setProcessing(true);
        setProgress(10);

        try {
            // Converter arquivo para base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            await new Promise((resolve) => {
                reader.onload = resolve;
            });

            const base64File = reader.result;
            setProgress(30);

            // Chamar função backend
            const response = await base44.functions.invoke('processarArquivoClaudeIA', {
                file: base64File,
                context: {
                    filename: file.name,
                    filetype: file.type,
                    ...context
                }
            });

            setProgress(100);

            if (response.data.success) {
                setResult(response.data);
                
                // Se houver campos faltantes, mostrar dialog
                if (response.data.missing_fields?.length > 0) {
                    setMissingFieldsDialog(true);
                } else {
                    setShowResultDialog(true);
                    toast.success('Arquivo processado com sucesso!');
                }

                // Notificar componente pai
                if (onRegistroCriado) {
                    onRegistroCriado(response.data.registro);
                }
            } else {
                toast.error('Erro ao processar arquivo');
            }

        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao processar arquivo: ' + error.message);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const completeMissingFields = async () => {
        try {
            // Atualizar registro com campos faltantes
            await base44.entities.Registro.update(result.registro_id, missingFieldsData);
            
            // Atualizar status para finalizado
            await base44.entities.Registro.update(result.registro_id, { status: 'finalizado' });
            
            toast.success('Registro completado!');
            setMissingFieldsDialog(false);
            setShowResultDialog(true);
        } catch (error) {
            toast.error('Erro ao completar registro');
        }
    };

    const getFileIcon = () => {
        if (!file) return <Upload className="w-8 h-8" />;
        
        const type = file.type;
        if (type.includes('image')) return <Image className="w-8 h-8 text-blue-600" />;
        if (type.includes('audio')) return <Music className="w-8 h-8 text-purple-600" />;
        if (type.includes('video')) return <Video className="w-8 h-8 text-red-600" />;
        return <FileText className="w-8 h-8 text-slate-600" />;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#E31E24]" />
                        Processamento Inteligente com Claude IA
                    </CardTitle>
                    <CardDescription>
                        Faça upload de PDFs, imagens, áudios ou vídeos e deixe a IA extrair e estruturar os dados automaticamente
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Upload Area */}
                    <div className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all
                        ${file ? 'border-[#E31E24] bg-red-50' : 'border-slate-300 hover:border-[#E31E24]'}
                    `}>
                        <label className="cursor-pointer block">
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.mp3,.mp4,.wav,.m4a,.docx"
                                onChange={handleFileChange}
                                disabled={processing}
                            />
                            <div className="flex flex-col items-center gap-3">
                                {getFileIcon()}
                                {file ? (
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-900">{file.name}</p>
                                        <p className="text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="text-sm">
                                        <p className="font-medium text-slate-700">Clique para selecionar arquivo</p>
                                        <p className="text-slate-500 mt-1">PDF, Imagem, Áudio ou Vídeo (máx. 50MB)</p>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Progress Bar */}
                    {processing && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Processando com Claude IA...</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        onClick={processFile}
                        disabled={!file || processing}
                        className="w-full bg-[#E31E24] hover:bg-[#B01419]"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Processar com IA
                            </>
                        )}
                    </Button>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-blue-900">📄 PDFs e Imagens</p>
                            <p className="text-xs text-blue-700 mt-1">OCR + Análise Visual</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-purple-900">🎤 Áudios e Vídeos</p>
                            <p className="text-xs text-purple-700 mt-1">Transcrição Automática</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs font-medium text-green-900">🧠 IA Avançada</p>
                            <p className="text-xs text-green-700 mt-1">Detecção de Duplicatas</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog: Missing Fields */}
            <Dialog open={missingFieldsDialog} onOpenChange={setMissingFieldsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Complete os campos obrigatórios</DialogTitle>
                        <DialogDescription>
                            A IA não conseguiu identificar alguns campos. Complete-os abaixo:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {result?.missing_fields?.map((field, index) => (
                            <div key={index} className="space-y-2">
                                <label className="text-sm font-medium">{field.pergunta_para_usuario}</label>
                                <Input
                                    placeholder={field.motivo}
                                    onChange={(e) => setMissingFieldsData({
                                        ...missingFieldsData,
                                        [field.campo]: e.target.value
                                    })}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setMissingFieldsDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={completeMissingFields} className="bg-[#E31E24] hover:bg-[#B01419]">
                            Completar Registro
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Result */}
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Processamento Concluído
                        </DialogTitle>
                    </DialogHeader>

                    {result && (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-600">Participantes</p>
                                    <p className="text-2xl font-bold text-blue-900">{result.extraction?.participantes?.length || 0}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-purple-600">Temas</p>
                                    <p className="text-2xl font-bold text-purple-900">{result.extraction?.temas_identificados?.length || 0}</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg">
                                    <p className="text-xs text-orange-600">Demandas</p>
                                    <p className="text-2xl font-bold text-orange-900">{result.extraction?.demandas?.length || 0}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="text-xs text-green-600">Compromissos</p>
                                    <p className="text-2xl font-bold text-green-900">{result.extraction?.compromissos?.length || 0}</p>
                                </div>
                            </div>

                            {/* Alertas Críticos */}
                            {result.alertas_criticos > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <p className="font-medium text-red-900">
                                            {result.alertas_criticos} alerta(s) crítico(s) detectado(s)
                                        </p>
                                    </div>
                                    {result.insights?.alertas?.map((alerta, i) => (
                                        <div key={i} className="text-sm text-red-700 mt-2">
                                            <strong>{alerta.tipo}:</strong> {alerta.justificativa}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Duplicatas */}
                            {result.possible_duplicates?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                        <p className="font-medium text-amber-900">Possíveis duplicatas detectadas</p>
                                    </div>
                                    {result.possible_duplicates.map((dup, i) => (
                                        <div key={i} className="text-sm text-amber-700 mt-1">
                                            • {dup.motivo} (confiança: {(dup.confidence * 100).toFixed(0)}%)
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Insights */}
                            {result.insights?.recomendacoes?.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Recomendações da IA</h4>
                                    <div className="space-y-2">
                                        {result.insights.recomendacoes.map((rec, i) => (
                                            <div key={i} className="bg-slate-50 p-3 rounded-lg text-sm">
                                                <p className="font-medium text-slate-900">{rec.acao}</p>
                                                <p className="text-slate-600 text-xs mt-1">{rec.por_que}</p>
                                                <Badge className="mt-2" variant={rec.prioridade === 'alta' || rec.prioridade === 'critica' ? 'destructive' : 'secondary'}>
                                                    {rec.prioridade}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    setShowResultDialog(false);
                                    window.location.href = `/VerRegistro?id=${result.registro_id}`;
                                }}
                                className="w-full bg-[#E31E24] hover:bg-[#B01419]"
                            >
                                Ver Registro Completo
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}