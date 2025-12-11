import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
    Edit, Save, X, FileText, AlertCircle, Users, Building2, 
    Calendar, MapPin, Paperclip, FileAudio, Activity 
} from "lucide-react";
import { format } from "date-fns";
import AtividadeConexoes from "./AtividadeConexoes";

export default function AtividadeDetalhada({ atividade, onUpdate, onClose }) {
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState(atividade);

    const handleSalvar = () => {
        onUpdate(formData);
        setEditando(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl my-8">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {editando ? (
                                <Input
                                    value={formData.titulo}
                                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                                    className="text-lg font-bold"
                                />
                            ) : (
                                <CardTitle className="text-2xl">{atividade.titulo || "Atividade sem título"}</CardTitle>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {editando ? (
                                <>
                                    <Button size="sm" onClick={handleSalvar} style={{ backgroundColor: '#F2B632' }}>
                                        <Save className="w-4 h-4 mr-1" />
                                        Salvar
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditando(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {/* Badges de status */}
                    <div className="flex flex-wrap gap-2">
                        {atividade.tipo && (
                            <Badge className="bg-blue-100 text-blue-800">{atividade.tipo}</Badge>
                        )}
                        {atividade.origem && (
                            <Badge className="bg-green-100 text-green-800">{atividade.origem}</Badge>
                        )}
                        {atividade.status_etapa && (
                            <Badge className="bg-purple-100 text-purple-800">{atividade.status_etapa}</Badge>
                        )}
                        {atividade.alertas_eticos && atividade.alertas_eticos.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {atividade.alertas_eticos.length} Alerta(s) Ético(s)
                            </Badge>
                        )}
                    </div>

                    {/* Informações básicas */}
                    <div className="grid grid-cols-2 gap-4">
                        {atividade.data && (
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{format(new Date(atividade.data), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                        )}
                        {atividade.local && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span>{atividade.local}</span>
                            </div>
                        )}
                    </div>

                    {/* Descrição */}
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Descrição
                        </h3>
                        {editando ? (
                            <Textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                rows={5}
                            />
                        ) : (
                            <p className="text-gray-700 whitespace-pre-wrap">{atividade.descricao}</p>
                        )}
                    </div>

                    {/* Transcrição IA */}
                    {atividade.transcricao_ia && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <FileAudio className="w-4 h-4" />
                                Transcrição da IA
                            </h3>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{atividade.transcricao_ia}</p>
                            </div>
                        </div>
                    )}

                    {/* Alertas Éticos */}
                    {atividade.alertas_eticos && atividade.alertas_eticos.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                                <AlertCircle className="w-4 h-4" />
                                Alertas Éticos
                            </h3>
                            <div className="space-y-2">
                                {atividade.alertas_eticos.map((alerta, idx) => (
                                    <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <p className="text-sm text-red-800">{alerta}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Participantes */}
                    {atividade.participantes && atividade.participantes.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Participantes
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {atividade.participantes.map((p, idx) => (
                                    <Badge key={idx} variant="outline">{p}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Temas Identificados */}
                    {atividade.temas_identificados && atividade.temas_identificados.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Temas Identificados pela IA
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {atividade.temas_identificados.map((tema, idx) => (
                                    <Badge key={idx} className="bg-indigo-100 text-indigo-800">{tema}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Demandas */}
                    {atividade.demandas && atividade.demandas.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Demandas</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {atividade.demandas.map((d, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">{d}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Compromissos */}
                    {atividade.compromissos && atividade.compromissos.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Compromissos Assumidos</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {atividade.compromissos.map((c, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">{c}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Próximos Passos */}
                    {atividade.proximos_passos && atividade.proximos_passos.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Próximos Passos</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {atividade.proximos_passos.map((p, idx) => (
                                    <li key={idx} className="text-sm text-gray-700">{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Anexos */}
                    {atividade.anexos && atividade.anexos.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                Anexos ({atividade.anexos.length})
                            </h3>
                            <div className="space-y-2">
                                {atividade.anexos.map((url, idx) => (
                                    <a 
                                        key={idx} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block text-sm text-blue-600 hover:underline"
                                    >
                                        Anexo {idx + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Conexões */}
                    {(atividade.liderancas_relacionadas || atividade.organizacoes_relacionadas) && (
                        <AtividadeConexoes 
                            atividadeId={atividade.id}
                            liderancasIds={atividade.liderancas_relacionadas}
                            organizacoesIds={atividade.organizacoes_relacionadas}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}