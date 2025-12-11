import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Shield, Users, UserPlus, Trash2, Edit, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePermissoes } from "../components/permissoes/usePermissoes";

export default function GerenciarPermissoes() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAdmin, loading: loadingPerms } = usePermissoes();
    const [mostrarFormRole, setMostrarFormRole] = useState(false);
    const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
    const [mostrarFormAtribuicao, setMostrarFormAtribuicao] = useState(false);
    const [roleEditando, setRoleEditando] = useState(null);
    const [grupoEditando, setGrupoEditando] = useState(null);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => base44.entities.Role.list()
    });

    const { data: grupos = [] } = useQuery({
        queryKey: ['grupos'],
        queryFn: () => base44.entities.GrupoUsuarios.list()
    });

    const { data: atribuicoes = [] } = useQuery({
        queryKey: ['atribuicoes'],
        queryFn: () => base44.entities.AtribuicaoPermissao.list()
    });

    const { data: comunidades = [] } = useQuery({
        queryKey: ['comunidades-perms'],
        queryFn: () => base44.entities.Comunidade.list()
    });

    const { data: usuarios = [] } = useQuery({
        queryKey: ['usuarios-sistema'],
        queryFn: () => base44.entities.User.list()
    });

    const criarRoleMutation = useMutation({
        mutationFn: (data) => base44.entities.Role.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['roles']);
            setMostrarFormRole(false);
            setRoleEditando(null);
        }
    });

    const atualizarRoleMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Role.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['roles']);
            setMostrarFormRole(false);
            setRoleEditando(null);
        }
    });

    const criarGrupoMutation = useMutation({
        mutationFn: (data) => base44.entities.GrupoUsuarios.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['grupos']);
            setMostrarFormGrupo(false);
            setGrupoEditando(null);
        }
    });

    const criarAtribuicaoMutation = useMutation({
        mutationFn: (data) => base44.entities.AtribuicaoPermissao.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['atribuicoes']);
            setMostrarFormAtribuicao(false);
        }
    });

    const excluirRoleMutation = useMutation({
        mutationFn: (id) => base44.entities.Role.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['roles'])
    });

    if (loadingPerms) {
        return <div className="p-6">Carregando...</div>;
    }

    if (!isAdmin()) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-red-600">❌ Você não tem permissão para acessar esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl("Configuracoes"))}
                        style={{ borderColor: '#0B1E33', color: '#0B1E33' }}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <h1 className="text-3xl font-bold" style={{ color: '#0B1E33' }}>
                        Gerenciar Permissões
                    </h1>
                </div>

                <Tabs defaultValue="roles" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="roles">
                            <Shield className="w-4 h-4 mr-2" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="grupos">
                            <Users className="w-4 h-4 mr-2" />
                            Grupos
                        </TabsTrigger>
                        <TabsTrigger value="atribuicoes">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Atribuições
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="roles" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Roles (Papéis)</CardTitle>
                                    <Button
                                        onClick={() => {
                                            setRoleEditando(null);
                                            setMostrarFormRole(true);
                                        }}
                                        style={{ backgroundColor: '#0B1E33' }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Role
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {roles.map(role => (
                                        <div key={role.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-bold text-lg">{role.nome}</h3>
                                                        <Badge>{role.nivel_acesso}</Badge>
                                                        {!role.ativo && <Badge variant="destructive">Inativo</Badge>}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">{role.descricao}</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                        {Object.entries(role.permissoes || {}).map(([ent, perms]) => {
                                                            const acoesAtivas = Object.entries(perms).filter(([_, v]) => v).map(([k]) => k);
                                                            if (acoesAtivas.length === 0) return null;
                                                            return (
                                                                <div key={ent} className="bg-gray-50 p-2 rounded">
                                                                    <p className="font-semibold capitalize">{ent}</p>
                                                                    <p className="text-gray-600">{acoesAtivas.join(', ')}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {role.restrito_por_regiao && (
                                                        <p className="text-xs text-amber-600 mt-2">
                                                            🌍 Restrição geográfica ativa
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setRoleEditando(role);
                                                            setMostrarFormRole(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm(`Excluir role "${role.nome}"?`)) {
                                                                excluirRoleMutation.mutate(role.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {mostrarFormRole && (
                            <FormRole
                                role={roleEditando}
                                onSalvar={(data) => {
                                    if (roleEditando) {
                                        atualizarRoleMutation.mutate({ id: roleEditando.id, data });
                                    } else {
                                        criarRoleMutation.mutate(data);
                                    }
                                }}
                                onCancelar={() => {
                                    setMostrarFormRole(false);
                                    setRoleEditando(null);
                                }}
                                comunidades={comunidades}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="grupos" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Grupos de Usuários</CardTitle>
                                    <Button
                                        onClick={() => {
                                            setGrupoEditando(null);
                                            setMostrarFormGrupo(true);
                                        }}
                                        style={{ backgroundColor: '#0B1E33' }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Novo Grupo
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {grupos.map(grupo => {
                                        const role = roles.find(r => r.id === grupo.role_id);
                                        return (
                                            <div key={grupo.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-bold text-lg">{grupo.nome}</h3>
                                                            <Badge>{role?.nome || 'Role não encontrado'}</Badge>
                                                            <Badge variant="outline">{grupo.nivel_organizacional}</Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{grupo.descricao}</p>
                                                        <p className="text-sm">
                                                            <strong>Usuários:</strong> {grupo.usuarios?.length || 0}
                                                        </p>
                                                        {grupo.comunidades_acesso && grupo.comunidades_acesso.length > 0 && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                🌍 {grupo.comunidades_acesso.length} comunidades
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setGrupoEditando(grupo);
                                                            setMostrarFormGrupo(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {mostrarFormGrupo && (
                            <FormGrupo
                                grupo={grupoEditando}
                                roles={roles}
                                comunidades={comunidades}
                                onSalvar={(data) => criarGrupoMutation.mutate(data)}
                                onCancelar={() => {
                                    setMostrarFormGrupo(false);
                                    setGrupoEditando(null);
                                }}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="atribuicoes" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Atribuições de Permissões</CardTitle>
                                    <Button
                                        onClick={() => setMostrarFormAtribuicao(true)}
                                        style={{ backgroundColor: '#0B1E33' }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Nova Atribuição
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {atribuicoes.map(atrib => {
                                        const role = roles.find(r => r.id === atrib.role_id);
                                        const grupo = grupos.find(g => g.id === atrib.grupo_id);
                                        return (
                                            <div key={atrib.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">{atrib.usuario_email}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <Badge>{role?.nome || 'Role não encontrado'}</Badge>
                                                            {grupo && <Badge variant="outline">{grupo.nome}</Badge>}
                                                            {!atrib.ativo && <Badge variant="destructive">Inativo</Badge>}
                                                        </div>
                                                        {atrib.comunidades_acesso && atrib.comunidades_acesso.length > 0 && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                Acesso: {atrib.comunidades_acesso.slice(0, 3).join(', ')}
                                                                {atrib.comunidades_acesso.length > 3 && '...'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {mostrarFormAtribuicao && (
                            <FormAtribuicao
                                roles={roles}
                                grupos={grupos}
                                comunidades={comunidades}
                                usuarios={usuarios}
                                onSalvar={(data) => criarAtribuicaoMutation.mutate(data)}
                                onCancelar={() => setMostrarFormAtribuicao(false)}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function FormRole({ role, onSalvar, onCancelar, comunidades }) {
    const [dados, setDados] = useState(role || {
        nome: '',
        descricao: '',
        nivel_acesso: 'basico',
        permissoes: {},
        restrito_por_regiao: false,
        comunidades_permitidas: [],
        ativo: true
    });

    const entidades = ['atividades', 'liderancas', 'organizacoes', 'compromissos', 'comunidades', 'relatorios', 'riscos', 'oportunidades', 'documentos', 'usuarios', 'configuracoes'];

    const togglePermissao = (entidade, acao) => {
        setDados({
            ...dados,
            permissoes: {
                ...dados.permissoes,
                [entidade]: {
                    ...(dados.permissoes[entidade] || {}),
                    [acao]: !(dados.permissoes[entidade]?.[acao])
                }
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{role ? 'Editar Role' : 'Novo Role'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Nome</Label>
                    <Input
                        value={dados.nome}
                        onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                        placeholder="Ex: Gestor Comunitário"
                    />
                </div>
                <div>
                    <Label>Descrição</Label>
                    <Textarea
                        value={dados.descricao}
                        onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                        placeholder="Descrição do papel"
                    />
                </div>
                <div>
                    <Label>Nível de Acesso</Label>
                    <Select value={dados.nivel_acesso} onValueChange={(v) => setDados({ ...dados, nivel_acesso: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basico">Básico</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="mb-3 block">Permissões por Entidade</Label>
                    <div className="space-y-3 max-h-96 overflow-y-auto border rounded p-3">
                        {entidades.map(ent => (
                            <div key={ent} className="border-b pb-3">
                                <p className="font-semibold capitalize mb-2">{ent}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['visualizar', 'criar', 'editar', 'excluir', 'gerar', 'exportar', 'upload', 'gerenciar', 'acessar', 'modificar'].map(acao => (
                                        <div key={acao} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${ent}-${acao}`}
                                                checked={dados.permissoes[ent]?.[acao] || false}
                                                onCheckedChange={() => togglePermissao(ent, acao)}
                                            />
                                            <Label htmlFor={`${ent}-${acao}`} className="text-xs cursor-pointer">
                                                {acao}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="restrito"
                        checked={dados.restrito_por_regiao}
                        onCheckedChange={(v) => setDados({ ...dados, restrito_por_regiao: v })}
                    />
                    <Label htmlFor="restrito">Restringir por região/comunidade</Label>
                </div>

                {dados.restrito_por_regiao && (
                    <div>
                        <Label>Comunidades Permitidas</Label>
                        <div className="border rounded p-3 max-h-40 overflow-y-auto">
                            {comunidades.map(c => (
                                <div key={c.id} className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                        id={`com-${c.id}`}
                                        checked={dados.comunidades_permitidas?.includes(c.nome) || false}
                                        onCheckedChange={(checked) => {
                                            const novas = checked
                                                ? [...(dados.comunidades_permitidas || []), c.nome]
                                                : (dados.comunidades_permitidas || []).filter(n => n !== c.nome);
                                            setDados({ ...dados, comunidades_permitidas: novas });
                                        }}
                                    />
                                    <Label htmlFor={`com-${c.id}`} className="cursor-pointer">{c.nome}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancelar} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={() => onSalvar(dados)} className="flex-1" style={{ backgroundColor: '#0B1E33' }}>
                        Salvar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function FormGrupo({ grupo, roles, comunidades, onSalvar, onCancelar }) {
    const [dados, setDados] = useState(grupo || {
        nome: '',
        descricao: '',
        role_id: '',
        usuarios: [],
        comunidades_acesso: [],
        nivel_organizacional: 'local',
        ativo: true
    });

    const [emailAdd, setEmailAdd] = useState('');

    return (
        <Card>
            <CardHeader>
                <CardTitle>{grupo ? 'Editar Grupo' : 'Novo Grupo'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Nome do Grupo</Label>
                    <Input
                        value={dados.nome}
                        onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                        placeholder="Ex: Equipe Regional Sul"
                    />
                </div>
                <div>
                    <Label>Descrição</Label>
                    <Textarea
                        value={dados.descricao}
                        onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Role Associado</Label>
                    <Select value={dados.role_id} onValueChange={(v) => setDados({ ...dados, role_id: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Nível Organizacional</Label>
                    <Select value={dados.nivel_organizacional} onValueChange={(v) => setDados({ ...dados, nivel_organizacional: v })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="corporativo">Corporativo</SelectItem>
                            <SelectItem value="regional">Regional</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="projeto">Projeto</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Adicionar Usuários (e-mail)</Label>
                    <div className="flex gap-2">
                        <Input
                            value={emailAdd}
                            onChange={(e) => setEmailAdd(e.target.value)}
                            placeholder="email@exemplo.com"
                        />
                        <Button
                            onClick={() => {
                                if (emailAdd && !dados.usuarios.includes(emailAdd)) {
                                    setDados({ ...dados, usuarios: [...dados.usuarios, emailAdd] });
                                    setEmailAdd('');
                                }
                            }}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {dados.usuarios.map(u => (
                            <Badge
                                key={u}
                                className="cursor-pointer"
                                onClick={() => setDados({ ...dados, usuarios: dados.usuarios.filter(e => e !== u) })}
                            >
                                {u} ✕
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancelar} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={() => onSalvar(dados)} className="flex-1" style={{ backgroundColor: '#0B1E33' }}>
                        Salvar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function FormAtribuicao({ roles, grupos, comunidades, usuarios, onSalvar, onCancelar }) {
    const [dados, setDados] = useState({
        usuario_email: '',
        role_id: '',
        grupo_id: '',
        comunidades_acesso: [],
        data_inicio: new Date().toISOString().split('T')[0],
        ativo: true
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nova Atribuição de Permissão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Usuário</Label>
                    <Select value={dados.usuario_email} onValueChange={(v) => setDados({ ...dados, usuario_email: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o usuário" />
                        </SelectTrigger>
                        <SelectContent>
                            {usuarios.map(u => (
                                <SelectItem key={u.id} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Role</Label>
                    <Select value={dados.role_id} onValueChange={(v) => setDados({ ...dados, role_id: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Grupo (Opcional)</Label>
                    <Select value={dados.grupo_id} onValueChange={(v) => setDados({ ...dados, grupo_id: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>Nenhum</SelectItem>
                            {grupos.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onCancelar} className="flex-1">
                        Cancelar
                    </Button>
                    <Button onClick={() => onSalvar(dados)} className="flex-1" style={{ backgroundColor: '#0B1E33' }}>
                        Atribuir
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}