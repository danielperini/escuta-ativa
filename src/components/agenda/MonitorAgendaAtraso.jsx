import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function MonitorAgendaAtraso() {
    const { data: agendas = [] } = useQuery({
        queryKey: ['agendas-monitor'],
        queryFn: () => base44.entities.Agenda.list(),
        refetchInterval: 3600000 // A cada hora
    });

    useEffect(() => {
        const verificarAtrasos = async () => {
            const agora = new Date();
            
            for (const agenda of agendas) {
                const statusVerificar = ["confirmada", "prevista", "solicitada", "acordada"];
                if (!statusVerificar.includes(agenda.status)) continue;
                if (agenda.alerta_atraso_enviado) continue;

                const dataAgenda = new Date(agenda.data);
                const diferencaHoras = (agora - dataAgenda) / (1000 * 60 * 60);

                // Verificar se passaram 72 horas
                if (diferencaHoras >= 72) {
                    // Verificar se há evidências de realização
                    const temEvidencias = agenda.evidencias_realizacao && agenda.evidencias_realizacao.length > 0;
                    
                    if (!temEvidencias) {
                        // Marcar como Em Atraso
                        await base44.entities.Agenda.update(agenda.id, {
                            status: "em_atraso",
                            alerta_atraso_enviado: true
                        });

                        // Criar notificação
                        await base44.entities.Notificacao.create({
                            tipo: "alerta_etico",
                            titulo: "Reunião sem Registro (72h)",
                            mensagem: `A reunião agendada para ${new Date(agenda.data).toLocaleDateString('pt-BR')} na comunidade ${agenda.comunidade || 'não especificada'} está sem registro de realização após 72 horas. Favor registrar documentação ou justificar a não realização.`,
                            prioridade: "alta",
                            entidade_relacionada_tipo: "Agenda",
                            entidade_relacionada_id: agenda.id
                        });
                    }
                }

                // Verificar se está há 7 dias em atraso (Pendência Crítica)
                if (agenda.status === "em_atraso" && diferencaHoras >= 168) {
                    await base44.entities.Notificacao.create({
                        tipo: "alerta_etico",
                        titulo: "⚠️ Pendência Crítica - Reunião 7 dias sem registro",
                        mensagem: `A reunião agendada para ${new Date(agenda.data).toLocaleDateString('pt-BR')} está há 7 dias sem registro. Ação urgente necessária.`,
                        prioridade: "alta",
                        entidade_relacionada_tipo: "Agenda",
                        entidade_relacionada_id: agenda.id
                    });
                }
            }
        };

        if (agendas.length > 0) {
            verificarAtrasos();
        }
    }, [agendas]);

    return null;
}