import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Cartão de destaque — KPI único (População total, Densidade, etc.)
 * Aceita ícone, valor, unidade, sub-descrição e cor de acento.
 */
export default function IndicadorCard({
  titulo,
  valor,
  unidade = '',
  descricao = '',
  icone: Icone,
  corAccent = 'bg-blue-100 text-blue-700',
  carregando = false
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-3 rounded-xl ${corAccent}`}>
          {Icone && <Icone className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</p>
          {carregando ? (
            <p className="text-2xl font-bold text-muted-foreground mt-1 animate-pulse">—</p>
          ) : (
            <p className="text-2xl font-bold text-foreground mt-1">
              {valor}{unidade && <span className="text-base text-muted-foreground ml-1">{unidade}</span>}
            </p>
          )}
          {descricao && (
            <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}