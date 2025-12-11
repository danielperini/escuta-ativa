import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function usePermissoes() {
    const [usuario, setUsuario] = useState(null);
    const [permissoes, setPermissoes] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarPermissoes();
    }, []);

    const carregarPermissoes = async () => {
        try {
            const userData = await base44.auth.me();
            setUsuario(userData);

            // Admin tem todas as permissões
            if (userData.role === 'admin') {
                setPermissoes({
                    role: 'admin',
                    nivel_acesso: 'total',
                    todas: true,
                    comunidades_acesso: []
                });
                setLoading(false);
                return;
            }

            // Buscar atribuição de permissão do usuário
            const atribuicoes = await base44.entities.AtribuicaoPermissao.list();
            const atribuicao = atribuicoes.find(a => a.usuario_email === userData.email && a.ativo);

            if (!atribuicao) {
                // Usuário sem permissões específicas - apenas visualização básica
                setPermissoes({
                    role: 'user',
                    nivel_acesso: 'basico',
                    permissoes: {
                        atividades: { visualizar: true, criar: false, editar: false, excluir: false }
                    },
                    comunidades_acesso: []
                });
                setLoading(false);
                return;
            }

            // Buscar role
            const role = await base44.entities.Role.list();
            const roleUsuario = role.find(r => r.id === atribuicao.role_id);

            if (!roleUsuario) {
                setPermissoes(null);
                setLoading(false);
                return;
            }

            // Combinar permissões do role com customizações
            const permissoesFinais = {
                role: roleUsuario.nome,
                nivel_acesso: roleUsuario.nivel_acesso,
                permissoes: {
                    ...roleUsuario.permissoes,
                    ...(atribuicao.permissoes_customizadas || {})
                },
                comunidades_acesso: atribuicao.comunidades_acesso || roleUsuario.comunidades_permitidas || [],
                restrito_por_regiao: roleUsuario.restrito_por_regiao || false
            };

            setPermissoes(permissoesFinais);
        } catch (error) {
            console.error("Erro ao carregar permissões:", error);
            setPermissoes(null);
        } finally {
            setLoading(false);
        }
    };

    const verificarPermissao = (entidade, acao) => {
        if (!permissoes) return false;
        if (permissoes.todas) return true;
        
        const permEntidade = permissoes.permissoes?.[entidade];
        if (!permEntidade) return false;
        
        return permEntidade[acao] === true;
    };

    const verificarAcessoComunidade = (comunidade) => {
        if (!permissoes) return false;
        if (permissoes.todas) return true;
        if (!permissoes.restrito_por_regiao) return true;
        if (!permissoes.comunidades_acesso || permissoes.comunidades_acesso.length === 0) return true;
        
        return permissoes.comunidades_acesso.includes(comunidade);
    };

    const isAdmin = () => {
        return usuario?.role === 'admin' || permissoes?.nivel_acesso === 'total';
    };

    return {
        usuario,
        permissoes,
        loading,
        verificarPermissao,
        verificarAcessoComunidade,
        isAdmin,
        recarregar: carregarPermissoes
    };
}