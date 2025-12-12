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
                if (!agenda.data) continue;

                try {
                    const dataAgenda = new Date(agenda.data);
                    if (isNaN(dataAgenda.getTime())) continue;
                    
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
                        }
                    }
                } catch (error) {
                    console.warn('Data inválida na agenda:', agenda.id, agenda.data);
                }
            }
        };

        if (agendas.length > 0) {
            verificarAtrasos();
        }
    }, [agendas]);

    return null;
}