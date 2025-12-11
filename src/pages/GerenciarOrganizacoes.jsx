import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Search, Edit, Trash2, Building2, Phone, Mail, Globe, Upload, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import DetectorDuplicatas from "../components/atores/DetectorDuplicatas";
import ResolvedorConflitos from "../components/atores/ResolvedorConflitos";
import HistoricoAuditoria from "../components/atores/HistoricoAuditoria";
import ImportadorCSV from "../components/atores/ImportadorCSV";

export default function GerenciarOrganizacoes() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [busca, setBusca] = useState("");
    const [filtroNatureza, setFiltroNatureza] = useState("todas");
    const [dialogAberto, setDialogAberto] = useState(false);
    const [organizacaoEditando, setOrganizacaoEditando] = useState(null);
    const [formData, setFormData] = useState({});
    const [verificandoDuplicatas, setVerificandoDuplicatas] = useState(false);
    const [conflitosDetectados, setConflitosDetectados] = useState(null);
    const [organizacaoSelecionada, setOrganizacaoSelecionada] = useState(null);
    const [showImportador, setShowImportador] = useState(false);

    const { data: organizacoes = [], isLoading } = useQuery({
        queryKey: ['organizacoes'],
        queryFn: () => base44.entities.ProjetoOrganizacao.list('-updated_date')
    });

    const criarMutation = useMutation({
        mutationFn: (data) => base44.entities.ProjetoOrganizacao.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizacoes'] });
            setDialogAberto(false);
            setFormData({});
        }
    });

    const atualizarMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.ProjetoOrganizacao.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizacoes'] });
            setDialogAberto(false);
            setOrganizacaoEditando(null);
            setFormData({});
        }
    });

    const deletarMutation = useMutation({
        mutationFn: (id) => base44.entities.ProjetoOrganizacao.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizacoes'] })
    });

    const organizacoesFiltradas = organizacoes.filter(org => {
        const matchBusca = !busca || 
            org.nome_oficial.toLowerCase().includes(busca.toLowerCase()) ||
            org.area_de_atuacao?.toLowerCase().includes(busca.toLowerCase());
        const matchNatureza = filtroNatureza === "todas" || org.natureza === filtroNatureza;
        return matchBusca && matchNatureza;
    });

    const abrirDialogNovo = () => {
        setOrganizacaoEditando(null);
        setFormData({
            nome_oficial: "",
            natureza: "outro",
            area_de_atuacao: "",
            avaliacao_interlocucao: "neutro"
        });
        setDialogAberto(true);
    };

    const abrirDialogEditar = (org) => {
        setOrganizacaoEditando(org);
        setFormData(org);
        setDialogAberto(true);
    };

    const handleSubmit = async () => {
        if (organizacaoEditando) {
            const conflitos = [];
            Object.keys(formData).forEach(campo => {
                if (organizacaoEditando[campo] && formData[campo] !== organizacaoEditando[campo]) {
                    conflitos.push({
                        campo: campo,
                        valor_antigo: organizacaoEditando[campo],
                        valor_novo: formData[campo],
                        fonte: 'Edição manual'
                    });
                }
            });

            if (conflitos.length > 0) {
                setConflitosDetectados(conflitos);
                return;
            }

            const usuario = await base44.auth.me();
            const dadosComAuditoria = {
                ...formData,
                historico_auditoria: [
                    ...(organizacaoEditando.historico_auditoria || []),
                    {
                        campo_alterado: 'Atualização manual',
                        valor_anterior: JSON.stringify(organizacaoEditando),
                        valor_novo: JSON.stringify(formData),
                        data_alteracao: new Date().toISOString(),
                        usuario_responsavel: usuario.email,
                        tipo_operacao: 'atualizacao'
                    }
                ]
            };

            atualizarMutation.mutate({ id: organizacaoEditando.id, data: dadosComAuditoria });
        } else {
            setVerificandoDuplicatas(true);
        }
    };

    const confirmarCriacao = async (resultado) => {
        const usuario = await base44.auth.me();

        if (resultado.tipo === 'vincular') {
            alert('Vinculado ao cadastro existente.');
            setVerificandoDuplicatas(false);
            setDialogAberto(false);
        } else if (resultado.tipo === 'criar_novo') {
            const dadosComAuditoria = {
                ...formData,
                historico_auditoria: [{
                    campo_alterado: 'Criação',
                    valor_anterior: null,
                    valor_novo: 'Cadastro criado',
                    data_alteracao: new Date().toISOString(),
                    usuario_responsavel: usuario.email,
                    tipo_operacao: 'criacao',
                    aprovacao_necessaria: true
                }]
            };

            criarMutation.mutate(dadosComAuditoria);
            setVerificandoDuplicatas(false);
        }
    };

    const resolverConflitos = async (decisoes) => {
        if (!decisoes) {
            setConflitosDetectados(null);
            return;
        }

        const usuario = await base44.auth.me();
        const dadosAtualizados = { ...formData };
        const auditorias = [];

        Object.keys(decisoes).forEach(campo => {
            const conflito = conflitosDetectados.find(c => c.campo === campo);
            if (decisoes[campo] === 'antigo') {
                dadosAtualizados[campo] = conflito.valor_antigo;
            } else if (decisoes[campo] === 'novo') {
                auditorias.push({
                    campo_alterado: campo,
                    valor_anterior: conflito.valor_antigo,
                    valor_novo: conflito.valor_novo,
                    data_alteracao: new Date().toISOString(),
                    usuario_responsavel: usuario.email,
                    tipo_operacao: 'atualizacao',
                    aprovacao_necessaria: true
                });
            }
        });

        const dadosFinais = {
            ...dadosAtualizados,
            historico_auditoria: [
                ...(organizacaoEditando.historico_auditoria || []),
                ...auditorias
            ]
        };

        atualizarMutation.mutate({ id: organizacaoEditando.id, data: dadosFinais });
        setConflitosDetectados(null);
    };

    const handleDeletar = (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta organização?")) {
            deletarMutation.mutate(id);
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
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
                            Gerenciar Organizações
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={abrirDialogNovo}
                            className="text-white"
                            style={{ backgroundColor: '#F2B632' }}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Organização
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowImportador(true)}
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            Importar CSV
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Buscar por nome ou área de atuação..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={filtroNatureza} onValueChange={setFiltroNatureza}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Natureza" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas</SelectItem>
                                    <SelectItem value="pública">Pública</SelectItem>
                                    <SelectItem value="privada">Privada</SelectItem>
                                    <SelectItem value="ONG">ONG</SelectItem>
                                    <SelectItem value="associação">Associação</SelectItem>
                                    <SelectItem value="sindicato">Sindicato</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                ) : organizacoesFiltradas.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-gray-500">Nenhuma organização encontrada.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {organizacoesFiltradas.map((org) => (
                            <Card key={org.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-3 rounded-full bg-purple-100">
                                                <Building2 className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg truncate" style={{ color: '#0B1E33' }}>
                                                    {org.nome_oficial}
                                                </CardTitle>
                                                {org.nome_fantasia && (
                                                    <p className="text-sm text-gray-500">({org.nome_fantasia})</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => setOrganizacaoSelecionada(org)}>
                                                <History className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => abrirDialogEditar(org)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeletar(org.id)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {org.area_de_atuacao && (
                                        <p className="text-sm text-gray-600">{org.area_de_atuacao}</p>
                                    )}

                                    {(org.telefone || org.email || org.site) && (
                                        <div className="space-y-1 text-sm">
                                            {org.telefone && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{org.telefone}</span>
                                                </div>
                                            )}
                                            {org.email && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{org.email}</span>
                                                </div>
                                            )}
                                            {org.site && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Globe className="w-3 h-3" />
                                                    <span className="truncate">{org.site}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {org.natureza && (
                                            <Badge className="bg-indigo-100 text-indigo-800">
                                                {org.natureza}
                                            </Badge>
                                        )}
                                        {org.avaliacao_interlocucao && (
                                            <Badge className={
                                                org.avaliacao_interlocucao === "boa" ? "bg-green-100 text-green-800" :
                                                org.avaliacao_interlocucao === "média" ? "bg-yellow-100 text-yellow-800" :
                                                org.avaliacao_interlocucao === "difícil" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-800"
                                            }>
                                                {org.avaliacao_interlocucao}
                                            </Badge>
                                        )}
                                    </div>

                                    {org.ultima_interacao && (
                                        <p className="text-xs text-gray-400">
                                            Última interação: {format(new Date(org.ultima_interacao), 'dd/MM/yyyy')}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {organizacaoEditando ? 'Editar Organização' : 'Nova Organização'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nome Oficial *</Label>
                                <Input
                                    value={formData.nome_oficial || ""}
                                    onChange={(e) => setFormData({...formData, nome_oficial: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Nome Fantasia</Label>
                                <Input
                                    value={formData.nome_fantasia || ""}
                                    onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Natureza *</Label>
                                <Select value={formData.natureza} onValueChange={(val) => setFormData({...formData, natureza: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pública">Pública</SelectItem>
                                        <SelectItem value="privada">Privada</SelectItem>
                                        <SelectItem value="ONG">ONG</SelectItem>
                                        <SelectItem value="associação">Associação</SelectItem>
                                        <SelectItem value="sindicato">Sindicato</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Avaliação de Interlocução</Label>
                                <Select value={formData.avaliacao_interlocucao} onValueChange={(val) => setFormData({...formData, avaliacao_interlocucao: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boa">Boa</SelectItem>
                                        <SelectItem value="média">Média</SelectItem>
                                        <SelectItem value="difícil">Difícil</SelectItem>
                                        <SelectItem value="neutro">Neutro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Área de Atuação</Label>
                            <Input
                                value={formData.area_de_atuacao || ""}
                                onChange={(e) => setFormData({...formData, area_de_atuacao: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Telefone</Label>
                                <Input
                                    value={formData.telefone || ""}
                                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>E-mail</Label>
                                <Input
                                    value={formData.email || ""}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Website</Label>
                                <Input
                                    value={formData.site || ""}
                                    onChange={(e) => setFormData({...formData, site: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Descrição</Label>
                            <Textarea
                                value={formData.descricao || ""}
                                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogAberto(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            style={{ backgroundColor: '#F2B632' }}
                            disabled={!formData.nome_oficial}
                        >
                            {organizacaoEditando ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {verificandoDuplicatas && (
                <Dialog open={verificandoDuplicatas} onOpenChange={() => setVerificandoDuplicatas(false)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DetectorDuplicatas
                            tipo="organizacao"
                            dadosNovo={formData}
                            onCancelar={() => setVerificandoDuplicatas(false)}
                            onConfirmar={confirmarCriacao}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {conflitosDetectados && (
                <Dialog open={!!conflitosDetectados} onOpenChange={() => setConflitosDetectados(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ResolvedorConflitos
                            conflitos={conflitosDetectados}
                            onResolver={resolverConflitos}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {organizacaoSelecionada && (
                <Dialog open={!!organizacaoSelecionada} onOpenChange={() => setOrganizacaoSelecionada(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <HistoricoAuditoria
                            atorId={organizacaoSelecionada.id}
                            tipoAtor="organizacao"
                        />
                    </DialogContent>
                </Dialog>
            )}

            {showImportador && (
                <Dialog open={showImportador} onOpenChange={setShowImportador}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ImportadorCSV
                            tipo="organizacao"
                            onConcluir={() => {
                                setShowImportador(false);
                                queryClient.invalidateQueries({ queryKey: ['organizacoes'] });
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}