'use client';

import { CircleDot } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-[#1a237e] text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2">
          <CircleDot className="h-5 w-5 text-yellow-400" />
          <p className="text-sm">Galinha Gorda - Gestao de Campeonatos</p>
        </div>
        <p className="text-center text-xs text-white/60 mt-2">
          Itapecerica - MG | {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
