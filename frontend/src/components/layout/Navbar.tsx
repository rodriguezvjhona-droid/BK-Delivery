'use client';

import React from 'react';
import { Menu, Wallet, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CashRegister } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onOpenSidebar: () => void;
}

export default function Navbar({ onOpenSidebar }: NavbarProps) {
  const { user } = useAuth();

  // Consulta en tiempo real de la caja abierta
  const { data: openRegister } = useQuery<CashRegister | null>({
    queryKey: ['current-cash-register'],
    queryFn: async () => {
      try {
        const res = await api.get('/cash-register/current');
        return res.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 15000,
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-bk-card/90 backdrop-blur-md border-b border-bk-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-gray-400 hover:text-white hover:bg-bk-hover rounded-xl lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-white">BK Delivery — Panel Operativo</h1>
          <p className="text-[11px] text-gray-400">Sistema Empresarial Conectado a PostgreSQL</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Indicador de Estado de Caja */}
        {openRegister ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wallet className="w-3.5 h-3.5" />
            <span>Caja Abierta: {formatCurrency(openRegister.expectedCash || 0)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <Wallet className="w-3.5 h-3.5" />
            <span>Caja Cerrada</span>
          </div>
        )}

        {/* Badge de Seguridad y Rol */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bk-hover text-gray-300 text-xs font-medium border border-bk-border">
          <ShieldCheck className="w-3.5 h-3.5 text-bk-gold" />
          <span>{user?.role}</span>
        </div>
      </div>
    </header>
  );
}
