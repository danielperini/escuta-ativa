import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, FileText, Target, AlertTriangle, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const tipoIcons = {
  reuniao: MessageSquare,
  registro: FileText,
  caso: Target,
  risco: AlertTriangle,
  devolutiva: TrendingUp
};

const impactoConfig = {
  positivo: { color: 'bg-green-100 text-green-700', icon: ThumbsUp },
  neutro: { color: 'bg-slate-100 text-slate-700', icon: MessageSquare },
  negativo: { color: 'bg-red-100 text-red-700', icon: ThumbsDown }
};

export default function HistoricoInteracoes({ timeline = [], registros = [], casos = [] }) {
  // Consolidar timeline com dados de registros e casos
  const timelineConsolidada = [
    ...timeline,
    ...registros.map(r => ({
      data: r.created_date,
      tipo: 'registro',
      descricao: r.titulo,
      registro_id: r.id,
      autor: r.created_by,
      impacto: r.sentimento === 'positivo' ? 'positivo' : r.sentimento === 'negativo' ? 'negativo' : 'neutro'
    })),
    ...casos.map(c => ({
      data: c.created_date,
      tipo: 'caso',
      descricao: c.titulo,
      caso_id: c.id,
      impacto: 'neutro'
    }))
  ].sort((a, b) => new Date(b.data) - new Date(a.data));

  if (timelineConsolidada.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma interação registrada</h3>
        <p className="text-slate-500">As interações aparecerão aqui conforme forem criadas</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Histórico de Interações ({timelineConsolidada.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha do tempo vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          <div className="space-y-4">
            {timelineConsolidada.map((item, idx) => {
              const Icon = tipoIcons[item.tipo] || FileText;
              const impacto = impactoConfig[item.impacto] || impactoConfig.neutro;
              const ImpactoIcon = impacto.icon;
              
              return (
                <div key={idx} className="relative pl-12 pb-4">
                  {/* Ícone da timeline */}
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-[#E31E24] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#E31E24]" />
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        {item.registro_id ? (
                          <Link 
                            to={createPageUrl('VerRegistro') + `?id=${item.registro_id}`}
                            className="font-medium text-slate-900 hover:text-blue-600"
                          >
                            {item.descricao}
                          </Link>
                        ) : item.caso_id ? (
                          <Link 
                            to={createPageUrl('VerCaso') + `?id=${item.caso_id}`}
                            className="font-medium text-slate-900 hover:text-blue-600"
                          >
                            {item.descricao}
                          </Link>
                        ) : (
                          <p className="font-medium text-slate-900">{item.descricao}</p>
                        )}
                      </div>
                      <Badge className={cn("shrink-0", impacto.color)}>
                        <ImpactoIcon className="w-3 h-3 mr-1" />
                        {item.impacto || 'neutro'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {item.autor && (
                        <span>Por: {item.autor}</span>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {item.tipo}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}