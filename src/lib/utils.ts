export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR');
}

export function formatDateInput(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildPaginationQuery(page: number, limit: number): { offset: number; limit: number } {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  return { offset: (safePage - 1) * safeLimit, limit: safeLimit };
}

export const POSITIONS = [
  'Goleiro',
  'Zagueiro',
  'Lateral Direito',
  'Lateral Esquerdo',
  'Volante',
  'Meia',
  'Meia Atacante',
  'Atacante',
  'Ponta Direita',
  'Ponta Esquerda',
] as const;

export const MATCH_STATUS = [
  'Agendada',
  'Em Andamento',
  'Finalizada',
  'Adiada',
  'Cancelada',
  'WO',
] as const;

export const CHAMPIONSHIP_STATUS = [
  'Planejado',
  'Inscricoes Abertas',
  'Em Andamento',
  'Finalizado',
  'Cancelado',
] as const;

export const EVENT_TYPES = [
  { value: 'GOL', label: 'Gol' },
  { value: 'GOL_CONTRA', label: 'Gol Contra' },
  { value: 'GOL_PENALTI', label: 'Gol de Pnalti' },
  { value: 'CARTAO_AMARELO', label: 'Carto Amarelo' },
  { value: 'CARTAO_VERMELHO', label: 'Carto Vermelho' },
  { value: 'SEGUNDO_AMARELO', label: 'Segundo Amarelo' },
  { value: 'SUBSTITUICAO_ENTRADA', label: 'Substituio (Entrada)' },
  { value: 'SUBSTITUICAO_SAIDA', label: 'Substituio (Sada)' },
] as const;
