import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from 'lucide-react';

export default function ContadorRegistrosRecentes({ registros }) {
  const agora = new Date();
  const vinteCincoHorasAtras = new Date(agora.getTime() - (24.5 * 60 * 60 * 1000));

  const registrosRecentes = registros.filter(r => {
    const dataCriacao = r.created_date ? new Date(r.created_date) : null;
    const dataAtualizacao = r.updated_date ? new Date(r.updated_date) : null;

    const criouRecente = dataCriacao && dataCriacao >= vinteCincoHorasAtras;
    const atualizouRecente = dataAtualizacao && dataAtualizacao >= vinteCincoHorasAtras;

    return criouRecente || atualizouRecente;
  });

  const total = registrosRecentes.length;

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-2 relative">
            <Clock className="w-10 h-10 text-white" />
            <span className="absolute -bottom-1 -right-1 bg-white text-emerald-600 font-bold text-xs px-2 py-0.5 rounded-full shadow-md border-2 border-emerald-500">
              24h
            </span>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Registros Atualizados</h3>
            <p className="text-6xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              {total}
            </p>
            <p className="text-sm font-medium text-slate-600">nas últimas 24 horas</p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed text-center">
            Os registros são classificados automaticamente com base na qualidade e na quantidade das informações preenchidas, 
            como identificação territorial, tipo de demanda e encaminhamentos. 
            Essa classificação é atualizada continuamente à medida que os registros são criados ou editados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}