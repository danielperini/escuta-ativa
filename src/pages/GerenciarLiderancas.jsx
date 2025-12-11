import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Search, Edit, Trash2, User, Phone, Mail, AlertCircle } from "lucide-react";
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

export default function GerenciarLiderancas() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [busca, setBusca] = useState("");
    const [filtroAvaliacao, setFiltroAvaliacao] = useState("todas");
    const [dialogAberto, setDialogAberto] = useState(false);
    const [liderancaEditando, setLiderancaEditando] = useState(null);
    const [formData, setFormData] = useState({});

    const { data: liderancas = [], isLoading } = useQuery({
        queryKey: ['liderancas'],
        queryFn: () => base44.entities.LiderancaComunitaria.list('-updated_date')
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const criarMutation = useMutation({
        mutationFn: (data) => base44.entities.LiderancaComunitaria.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liderancas'] });
            setDialogAberto(false);
            setFormData({});
        }
    });

    const atualizarMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.LiderancaComunitaria.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['liderancas'] });
            setDialogAberto(false);
            setLiderancaEditando(null);
            setFormData({});
        }
    });

    const deletarMutation = useMutation({
        mutationFn: (id) => base44.entities.LiderancaComunitaria.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liderancas'] })
    });

    const liderancasFiltradas = liderancas.filter(lid => {
        const matchBusca = !busca || 
            lid.nome.toLowerCase().includes(busca.toLowerCase()) ||
            lid.comunidade?.toLowerCase().includes(busca.toLowerCase());
        const matchAvaliacao = filtroAvaliacao === "todas" || lid.avaliacao_interlocucao === filtroAvaliacao;
        return matchBusca && matchAvaliacao;
    });

    const abrirDialogNovo = () => {
        setLiderancaEditando(null);
        setFormData({
            nome: "",
            comunidade: "",
            papel_na_comunidade: "",
            telefone: "",
            whatsapp: "",
            email: "",
            avaliacao_interlocucao: "neutro",
            autorizado_LGPD: false
        });
        setDialogAberto(true);
    };

    const abrirDialogEditar = (lid) => {
        setLiderancaEditando(lid);
        setFormData(lid);
        setDialogAberto(true);
    };

    const handleSubmit = () => {
        if (liderancaEditando) {
            atualizarMutation.mutate({ id: liderancaEditando.id, data: formData });
        } else {
            criarMutation.mutate(formData);
        }
    };

    const handleDeletar = (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta liderança?")) {
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
                            Gerenciar Lideranças Comunitárias
                        </h1>
                    </div>
                    <Button
                        onClick={abrirDialogNovo}
                        className="text-white"
                        style={{ backgroundColor: '#F2B632' }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Liderança
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Buscar por nome ou comunidade..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={filtroAvaliacao} onValueChange={setFiltroAvaliacao}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Avaliação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas avaliações</SelectItem>
                                    <SelectItem value="boa">Boa</SelectItem>
                                    <SelectItem value="média">Média</SelectItem>
                                    <SelectItem value="difícil">Difícil</SelectItem>
                                    <SelectItem value="neutro">Neutro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                ) : liderancasFiltradas.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <p className="text-gray-500">Nenhuma liderança encontrada.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liderancasFiltradas.map((lid) => (
                            <Card key={lid.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-3 rounded-full" style={{ backgroundColor: '#F2B632' }}>
                                                <User className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg truncate" style={{ color: '#0B1E33' }}>
                                                    {lid.nome}
                                                </CardTitle>
                                                {lid.nome_social && (
                                                    <p className="text-sm text-gray-500">({lid.nome_social})</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => abrirDialogEditar(lid)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeletar(lid.id)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: '#0B1E33' }}>
                                            {lid.comunidade}
                                        </p>
                                        {lid.papel_na_comunidade && (
                                            <p className="text-xs text-gray-600">{lid.papel_na_comunidade}</p>
                                        )}
                                    </div>

                                    {(lid.telefone || lid.whatsapp || lid.email) && (
                                        <div className="space-y-1 text-sm">
                                            {lid.telefone && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    <span>{lid.telefone}</span>
                                                </div>
                                            )}
                                            {lid.email && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{lid.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {lid.avaliacao_interlocucao && (
                                            <Badge className={
                                                lid.avaliacao_interlocucao === "boa" ? "bg-green-100 text-green-800" :
                                                lid.avaliacao_interlocucao === "média" ? "bg-yellow-100 text-yellow-800" :
                                                lid.avaliacao_interlocucao === "difícil" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-800"
                                            }>
                                                {lid.avaliacao_interlocucao}
                                            </Badge>
                                        )}
                                        {lid.autorizado_LGPD ? (
                                            <Badge className="bg-green-100 text-green-800">LGPD OK</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Sem autorização
                                            </Badge>
                                        )}
                                    </div>

                                    {lid.ultima_interacao && (
                                        <p className="text-xs text-gray-400">
                                            Última interação: {format(new Date(lid.ultima_interacao), 'dd/MM/yyyy')}
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
                            {liderancaEditando ? 'Editar Liderança' : 'Nova Liderança'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nome Completo *</Label>
                                <Input
                                    value={formData.nome || ""}
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>Nome Social</Label>
                                <Input
                                    value={formData.nome_social || ""}
                                    onChange={(e) => setFormData({...formData, nome_social: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Comunidade *</Label>
                            <Select value={formData.comunidade} onValueChange={(val) => setFormData({...formData, comunidade: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {comunidades.map(c => (
                                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Papel na Comunidade</Label>
                            <Input
                                value={formData.papel_na_comunidade || ""}
                                onChange={(e) => setFormData({...formData, papel_na_comunidade: e.target.value})}
                                placeholder="Ex: Liderança cultural, Articulador..."
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
                                <Label>WhatsApp</Label>
                                <Input
                                    value={formData.whatsapp || ""}
                                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                                />
                            </div>
                            <div>
                                <Label>E-mail</Label>
                                <Input
                                    value={formData.email || ""}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Descrição / Minibiografia</Label>
                            <Textarea
                                value={formData.descricao || ""}
                                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                rows={3}
                            />
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogAberto(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            style={{ backgroundColor: '#F2B632' }}
                            disabled={!formData.nome || !formData.comunidade}
                        >
                            {liderancaEditando ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}