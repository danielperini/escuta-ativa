import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function NotificationGenerator() {
    const { data: atividades = [] } = useQuery({
        queryKey: ['atividades-notif'],
        queryFn: () => base44.entities.Atividade.list('-created_date', 10),
        refetchInterval: 60000 // A cada minuto
    });

    const { data: liderancas = [] } = useQuery({
        queryKey: ['liderancas-notif'],
        queryFn: () => base44.entities.LiderancaComunitaria.list()
    });

    useEffect(() => {
        const verificarNotificacoes = async () => {
            // 1. Verificar lideranças que precisam atualização
            const hoje = new Date();
            const seisMesesAtras = new Date(hoje.setMonth(hoje.getMonth() - 6));

            for (const lid of liderancas) {
                if (lid.ultima_interacao) {
                    const ultimaInteracao = new Date(lid.ultima_interacao);
                    if (ultimaInteracao < seisMesesAtras && !lid.necessidade_atualizacao) {
                        await base44.entities.LiderancaComunitaria.update(lid.id, {
                            necessidade_atualizacao: true
                        });

                        await base44.entities.Notificacao.create({
                            tipo: "atualizacao_cadastro",
                            titulo: "Atualização de Cadastro Necessária",
                            mensagem: `A liderança ${lid.nome} não tem interações há mais de 6 meses. Considere atualizar o cadastro.`,
                            prioridade: "media",
                            entidade_relacionada_tipo: "LiderancaComunitaria",
                            entidade_relacionada_id: lid.id
                        });
                    }
                }
            }

            // 2. Notificar sobre novas conexões em atividades recentes
            const atividadesRecentes = atividades.filter(a => {
                const criacao = new Date(a.created_date);
                const umDiaAtras = new Date();
                umDiaAtras.setDate(umDiaAtras.getDate() - 1);
                return criacao > umDiaAtras;
            });

            for (const ativ of atividadesRecentes) {
                if ((ativ.liderancas_relacionadas && ativ.liderancas_relacionadas.length > 0) ||
                    (ativ.organizacoes_relacionadas && ativ.organizacoes_relacionadas.length > 0)) {
                    
                    const existentes = await base44.entities.Notificacao.list();
                    const jaNotificado = existentes.some(n => 
                        n.entidade_relacionada_id === ativ.id && n.tipo === "nova_conexao"
                    );

                    if (!jaNotificado) {
                        await base44.entities.Notificacao.create({
                            tipo: "nova_conexao",
                            titulo: "Novas Conexões Identificadas",
                            mensagem: `A IA identificou ${(ativ.liderancas_relacionadas?.length || 0) + (ativ.organizacoes_relacionadas?.length || 0)} conexões na atividade "${ativ.titulo || 'sem título'}".`,
                            prioridade: "alta",
                            entidade_relacionada_tipo: "Atividade",
                            entidade_relacionada_id: ativ.id
                        });
                    }
                }

                // 3. Notificar sobre novas demandas
                if (ativ.demandas && ativ.demandas.length > 0) {
                    const existentes = await base44.entities.Notificacao.list();
                    const jaNotificado = existentes.some(n => 
                        n.entidade_relacionada_id === ativ.id && n.tipo === "nova_demanda"
                    );

                    if (!jaNotificado) {
                        await base44.entities.Notificacao.create({
                            tipo: "nova_demanda",
                            titulo: "Novas Demandas Identificadas",
                            mensagem: `A IA identificou ${ativ.demandas.length} demanda(s) na atividade "${ativ.titulo || 'sem título'}".`,
                            prioridade: "alta",
                            entidade_relacionada_tipo: "Atividade",
                            entidade_relacionada_id: ativ.id
                        });
                    }
                }

                // 5. Notificar sobre alertas éticos
                if (ativ.alertas_eticos && ativ.alertas_eticos.length > 0) {
                    const existentes = await base44.entities.Notificacao.list();
                    const jaNotificado = existentes.some(n => 
                        n.entidade_relacionada_id === ativ.id && n.tipo === "alerta_etico"
                    );

                    if (!jaNotificado) {
                        await base44.entities.Notificacao.create({
                            tipo: "alerta_etico",
                            titulo: "⚠️ Alertas Éticos Detectados",
                            mensagem: `A IA identificou ${ativ.alertas_eticos.length} alerta(s) ético(s) que requerem atenção.`,
                            prioridade: "alta",
                            entidade_relacionada_tipo: "Atividade",
                            entidade_relacionada_id: ativ.id
                        });
                    }
                }
            }
        };

        if (atividades.length > 0 && liderancas.length > 0) {
            verificarNotificacoes();
        }
    }, [atividades, liderancas]);

    return null;
}