import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, User, Palette, LayoutDashboard, Globe, Clock, Bell, Check, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PreferenciasUsuario() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [salvando, setSalvando] = useState(false);

    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me()
    });

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        telefone: '',
        cargo: '',
        bio: '',
        configuracoes: {
            tema: 'claro',
            paineis_dashboard: ['kpis', 'demandas_recorrentes', 'devolutivas', 'voz_comunidade'],
            idioma_relatorios: 'pt-BR',
            prazo_devolutiva_dias: 15,
            notificacoes_email: true,
            exibir_tutorial: true
        }
    });

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                telefone: user.telefone || '',
                cargo: user.cargo || '',
                bio: user.bio || '',
                configuracoes: {
                    tema: user.configuracoes?.tema || 'claro',
                    paineis_dashboard: user.configuracoes?.paineis_dashboard || ['kpis', 'demandas_recorrentes', 'devolutivas', 'voz_comunidade'],
                    idioma_relatorios: user.configuracoes?.idioma_relatorios || 'pt-BR',
                    prazo_devolutiva_dias: user.configuracoes?.prazo_devolutiva_dias || 15,
                    notificacoes_email: user.configuracoes?.notificacoes_email !== false,
                    exibir_tutorial: user.configuracoes?.exibir_tutorial !== false
                }
            });
        }
    }, [user]);

    const handleSalvar = async () => {
        setSalvando(true);
        try {
            await base44.auth.updateMe({
                telefone: formData.telefone,
                cargo: formData.cargo,
                bio: formData.bio,
                configuracoes: formData.configuracoes
            });

            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            alert('✓ Configurações salvas com sucesso!');
            window.location.reload(); // Recarregar para aplicar tema
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        } finally {
            setSalvando(false);
        }
    };

    const togglePainel = (painel) => {
        const paineis = formData.configuracoes.paineis_dashboard;
        const novoPaineis = paineis.includes(painel)
            ? paineis.filter(p => p !== painel)
            : [...paineis, painel];
        
        setFormData({
            ...formData,
            configuracoes: {
                ...formData.configuracoes,
                paineis_dashboard: novoPaineis
            }
        });
    };

    const paineisDisponiveis = [
        { id: 'kpis', nome: 'Indicadores-Chave (KPIs)', descricao: 'Estatísticas principais do sistema' },
        { id: 'demandas_recorrentes', nome: 'Demandas Recorrentes', descricao: 'Monitor de demandas repetidas' },
        { id: 'devolutivas', nome: 'Monitor de Devolutivas', descricao: 'Devolutivas pendentes e atrasadas' },
        { id: 'voz_comunidade', nome: 'Voz da Comunidade', descricao: 'Principais temas e falas recentes' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
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
                        Preferências do Usuário
                    </h1>
                </div>
                <Button
                    onClick={handleSalvar}
                    disabled={salvando}
                    className="bg-[#F2B632] hover:bg-[#d9a429]"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>

            {/* Perfil do Usuário */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Perfil
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label>Nome Completo</Label>
                            <Input
                                value={formData.full_name}
                                disabled
                                className="bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Não é possível alterar o nome
                            </p>
                        </div>
                        <div>
                            <Label>E-mail</Label>
                            <Input
                                value={formData.email}
                                disabled
                                className="bg-gray-100"
                            />
                        </div>
                        <div>
                            <Label>Telefone</Label>
                            <Input
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <Label>Cargo / Função</Label>
                            <Input
                                value={formData.cargo}
                                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                placeholder="Ex: Analista de Relacionamento"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Biografia</Label>
                        <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Conte um pouco sobre você..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Aparência
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-3 block">Tema de Cores</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    configuracoes: { ...formData.configuracoes, tema: 'claro' }
                                })}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    formData.configuracoes.tema === 'claro'
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="bg-white border rounded p-3 mb-2">
                                    <div className="h-2 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-2 bg-gray-100 rounded w-2/3"></div>
                                </div>
                                <p className="font-semibold text-sm">Tema Claro</p>
                                {formData.configuracoes.tema === 'claro' && (
                                    <Badge className="bg-green-600 mt-2">
                                        <Check className="w-3 h-3 mr-1" />
                                        Ativo
                                    </Badge>
                                )}
                            </button>

                            <button
                                onClick={() => setFormData({
                                    ...formData,
                                    configuracoes: { ...formData.configuracoes, tema: 'escuro' }
                                })}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    formData.configuracoes.tema === 'escuro'
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="bg-gray-800 border border-gray-700 rounded p-3 mb-2">
                                    <div className="h-2 bg-gray-600 rounded mb-1"></div>
                                    <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                                </div>
                                <p className="font-semibold text-sm">Tema Escuro</p>
                                {formData.configuracoes.tema === 'escuro' && (
                                    <Badge className="bg-green-600 mt-2">
                                        <Check className="w-3 h-3 mr-1" />
                                        Ativo
                                    </Badge>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            A página será recarregada automaticamente ao salvar para aplicar o tema
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Painéis do Dashboard */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5" />
                        Painéis do Dashboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Escolha quais módulos devem aparecer na página inicial:
                    </p>
                    <div className="space-y-2">
                        {paineisDisponiveis.map((painel) => {
                            const ativo = formData.configuracoes.paineis_dashboard.includes(painel.id);
                            
                            return (
                                <div
                                    key={painel.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{painel.nome}</p>
                                        <p className="text-xs text-gray-500">{painel.descricao}</p>
                                    </div>
                                    <Switch
                                        checked={ativo}
                                        onCheckedChange={() => togglePainel(painel.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Idioma */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Idioma e Localização
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Idioma para Relatórios e IA</Label>
                        <Select
                            value={formData.configuracoes.idioma_relatorios}
                            onValueChange={(val) => setFormData({
                                ...formData,
                                configuracoes: { ...formData.configuracoes, idioma_relatorios: val }
                            })}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                                <SelectItem value="es">🇪🇸 Español</SelectItem>
                                <SelectItem value="en">🇺🇸 English</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-2">
                            Define o idioma usado pela IA para gerar relatórios, análises e respostas
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Prazos e Alertas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Prazos e Alertas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Prazo Padrão para Devolutivas (dias)</Label>
                        <div className="flex items-center gap-4 mt-2">
                            <Input
                                type="number"
                                min={1}
                                max={90}
                                value={formData.configuracoes.prazo_devolutiva_dias}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    configuracoes: {
                                        ...formData.configuracoes,
                                        prazo_devolutiva_dias: parseInt(e.target.value) || 15
                                    }
                                })}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-600">dias</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Após este prazo, devolutivas pendentes serão marcadas como "em atraso"
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notificações
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-sm">Notificações por E-mail</p>
                            <p className="text-xs text-gray-500">
                                Receber alertas de devolutivas atrasadas, novos registros e compromissos
                            </p>
                        </div>
                        <Switch
                            checked={formData.configuracoes.notificacoes_email}
                            onCheckedChange={(checked) => setFormData({
                                ...formData,
                                configuracoes: { ...formData.configuracoes, notificacoes_email: checked }
                            })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-sm">Exibir Dicas e Tutoriais</p>
                            <p className="text-xs text-gray-500">
                                Mostrar dicas contextuais ao usar o sistema
                            </p>
                        </div>
                        <Switch
                            checked={formData.configuracoes.exibir_tutorial}
                            onCheckedChange={(checked) => setFormData({
                                ...formData,
                                configuracoes: { ...formData.configuracoes, exibir_tutorial: checked }
                            })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">Sobre o Sistema</p>
                            <p>Escuta Ativa - Inteligência Territorial v2.0</p>
                            <p className="text-xs text-blue-700 mt-2">
                                Role: <Badge className="bg-blue-600">{user?.role || 'user'}</Badge>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4 border-t">
                <Button
                    onClick={handleSalvar}
                    disabled={salvando}
                    size="lg"
                    className="bg-[#0B1E33] hover:bg-[#1a3a52] px-8"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {salvando ? 'Salvando...' : 'Salvar Todas as Configurações'}
                </Button>
            </div>
        </div>
    );
}