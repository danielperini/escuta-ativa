import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck } from 'lucide-react';

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
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Registros</h3>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">
              {total} atualizados nas últimas 24 horas
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Os registros são classificados automaticamente com base na qualidade e na quantidade das informações preenchidas, 
          como identificação territorial, tipo de demanda e encaminhamentos. 
          Essa classificação é atualizada continuamente à medida que os registros são criados ou editados.
        </p>
      </CardContent>
    </Card>
  );
}