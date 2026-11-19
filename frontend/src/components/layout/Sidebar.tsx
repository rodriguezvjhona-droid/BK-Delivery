'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Boxes,
  Wallet,
  Receipt,
  TrendingUp,
  Printer,
  Bike,
  FileBarChart2,
  Users,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { RoleEnum } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Punto de Venta (POS)', href: '/pos', icon: Store, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Catálogo de Productos', href: '/products', icon: UtensilsCrossed, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Inventario & Kardex', href: '/inventory', icon: Boxes, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Control de Caja', href: '/cash', icon: Wallet, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Gastos del Negocio', href: '/expenses', icon: Receipt, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE] },
    { label: 'Finanzas & Utilidad', href: '/finances', icon: TrendingUp, roles: [RoleEnum.ADMIN] },
    { label: 'Facturación & Tickets', href: '/invoices', icon: Printer, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY] },
    { label: 'Despacho & Domicilios', href: '/delivery', icon: Bike, roles: [RoleEnum.ADMIN, RoleEnum.EMPLOYEE, RoleEnum.DELIVERY] },
    { label: 'Centro de Reportes', href: '/reports', icon: FileBarChart2, roles: [RoleEnum.ADMIN] },
    { label: 'Usuarios y Accesos', href: '/users', icon: Users, roles: [RoleEnum.ADMIN] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-bk-card border-r border-bk-border transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Encabezado Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-bk-border bg-[#0f1012]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-bk-red to-bk-red-dark shadow-md text-white font-extrabold text-lg">
              BK
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">BK DELIVERY</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-bk-gold">
                Gourmet & Craft
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-bk-hover lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de navegación con scroll */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-bk-red/20 to-bk-red/5 text-white border-l-4 border-bk-red font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-bk-hover'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-bk-red' : 'text-gray-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pie de Sidebar con usuario y cierre de sesión */}
        <div className="p-4 border-t border-bk-border bg-[#0f1012]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bk-hover text-bk-gold font-bold text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase bg-bk-hover text-bk-gold border border-bk-gold/20">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 text-gray-400 hover:text-bk-red hover:bg-bk-hover rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
