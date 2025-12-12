import React from "react";
import { Bell, X, Check, AlertCircle, Users, Building2, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function NotificationCenter() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: notificacoes = [] } = useQuery({
        queryKey: ['notificacoes'],
        queryFn: async () => {
            const todas = await base44.entities.Notificacao.list('-created_date', 50);
            return todas;
        },
        refetchInterval: 30000 // Atualiza a cada 30 segundos
    });

    const marcarComoLidaMutation = useMutation({
        mutationFn: (id) => base44.entities.Notificacao.update(id, { lida: true }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    });

    const excluirNotificacaoMutation = useMutation({
        mutationFn: (id) => base44.entities.Notificacao.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    });

    const resolverNotificacaoMutation = useMutation({
        mutationFn: (id) => base44.entities.Notificacao.update(id, { status: 'resolvida', lida: true }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    });

    // Auto-dismiss após 10 segundos
    React.useEffect(() => {
        const naoLidasRecentes = naoLidas.filter(n => {
            const criacao = new Date(n.created_date);
            const agora = new Date();
            const diferenca = (agora - criacao) / 1000;
            return diferenca >= 10;
        });

        if (naoLidasRecentes.length > 0) {
            naoLidasRecentes.forEach(n => {
                marcarComoLidaMutation.mutate(n.id);
            });
        }
    }, [notificacoes]);

    const marcarTodasLidasMutation = useMutation({
        mutationFn: async () => {
            const naoLidas = notificacoes.filter(n => !n.lida && n.status !== 'resolvida');
            await Promise.all(naoLidas.map(n => 
                base44.entities.Notificacao.update(n.id, { lida: true })
            ));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    });

    const naoLidas = notificacoes.filter(n => !n.lida && n.status !== 'resolvida');

    const getIcon = (tipo) => {
        switch(tipo) {
            case "atualizacao_cadastro": return <Users className="w-4 h-4" />;
            case "nova_conexao": return <Building2 className="w-4 h-4" />;
            case "nova_demanda": return <FileText className="w-4 h-4" />;
            case "novo_compromisso": return <FileText className="w-4 h-4" />;
            case "alerta_etico": return <AlertCircle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const getPrioridadeColor = (prioridade) => {
        if (prioridade === "alta") return "bg-red-100 text-red-800";
        if (prioridade === "media") return "bg-yellow-100 text-yellow-800";
        return "bg-blue-100 text-blue-800";
    };

    const handleNotificationClick = (notif) => {
        marcarComoLidaMutation.mutate(notif.id);
        
        if (notif.entidade_relacionada_tipo === "Atividade") {
            navigate(createPageUrl("Atividades"));
        } else if (notif.entidade_relacionada_tipo === "LiderancaComunitaria") {
            navigate(createPageUrl("Liderancas"));
        } else if (notif.entidade_relacionada_tipo === "ProjetoOrganizacao") {
            navigate(createPageUrl("Organizacoes"));
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {naoLidas.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Notificações</h3>
                    {naoLidas.length > 0 && (
                        <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => marcarTodasLidasMutation.mutate()}
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Marcar todas lidas
                        </Button>
                    )}
                </div>
                
                <ScrollArea className="h-96">
                    {notificacoes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhuma notificação
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notificacoes.map((notif) => (
                                <div 
                                    key={notif.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors ${!notif.lida ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${getPrioridadeColor(notif.prioridade)}`}>
                                            {getIcon(notif.tipo)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notif)}>
                                                    <p className="font-medium text-sm">{notif.titulo}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{notif.mensagem}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!notif.lida && notif.status !== 'resolvida' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                resolverNotificacaoMutation.mutate(notif.id);
                                                            }}
                                                            title="Marcar como resolvida"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            excluirNotificacaoMutation.mutate(notif.id);
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                               <p className="text-xs text-gray-400">
                                                   {format(new Date(notif.created_date), 'dd/MM/yyyy HH:mm')}
                                               </p>
                                               {notif.status === 'resolvida' && (
                                                   <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                                       ✓ Resolvida
                                                   </Badge>
                                               )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}