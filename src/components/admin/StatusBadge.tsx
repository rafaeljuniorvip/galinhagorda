'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function getStatusVariant(status: string): StatusVariant {
  const normalized = status.toLowerCase();
  if (['ativo', 'ativa', 'finalizada', 'aprovada', 'publicada', 'sim'].includes(normalized)) return 'success';
  if (['em andamento', 'em_andamento', 'em preparação', 'pendente'].includes(normalized)) return 'warning';
  if (['inativo', 'inativa', 'cancelada', 'rejeitada', 'não', 'wo'].includes(normalized)) return 'error';
  if (['agendada', 'adiada', 'inscricoes_abertas'].includes(normalized)) return 'info';
  return 'default';
}

export default function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const v = variant ?? getStatusVariant(status);
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', variantStyles[v], className)}
    >
      {status}
    </Badge>
  );
}
