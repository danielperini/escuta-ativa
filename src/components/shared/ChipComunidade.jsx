import React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChipComunidade — padrão visual global para marcar a REFERÊNCIA
 * a uma comunidade/território específico.
 *
 * Uso: <ChipComunidade nome="Matozinhos" />
 *      <ChipComunidade nome={r.comunidade} size="md" />
 *
 * Visual: pílula temática discreta com ícone MapPin + nome.
 * Renderiza null quando `nome` for vazio (não exibe nada).
 */
export default function ChipComunidade({
  nome,
  size = 'sm',
  icon: Icon = MapPin,
  variant = 'default',
  titulo,
  className
}) {
  if (!nome || String(nome).trim() === '') return null;
  const label = String(nome).trim();

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 gap-1 [&_svg]:w-3 [&_svg]:h-3'
    : 'text-xs px-2.5 py-1 gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5';

  const variantClasses = {
    default: 'bg-primary/10 text-primary border-primary/20',
    neutro: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'bg-transparent text-foreground border-border'
  }[variant] || 'bg-primary/10 text-primary border-primary/20';

  return (
    <span
      title={titulo || `Comunidade referenciada: ${label}`}
      aria-label={`Comunidade referenciada: ${label}`}
      className={cn(
        'inline-flex items-center rounded-full border font-medium whitespace-nowrap align-middle',
        sizeClasses,
        variantClasses,
        className
      )}
    >
      <Icon className="shrink-0" />
      <span className="truncate max-w-[160px]">{label}</span>
    </span>
  );
}