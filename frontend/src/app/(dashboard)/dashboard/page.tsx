'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Receipt,
  Store,
  Wallet,
  Bike,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { Product, DeliveryOrder } from '@/types';

export default function DashboardPage() {
  // Estadísticas de ventas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/sales/dashboard/stats');
      return res.data;
    },
  });

  // Resumen de gastos
  const { data: expensesSummary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const res = await api.get('/expenses/summary');
      return res.data;
    },
  });

  // Alertas de inventario bajo
  const { data: lowStockProducts } = useQuery<Product[]>({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts/low-stock');
      return res.data;
    },
  });

  // Pedidos activos de domicilios
  const { data: activeDeliveries } = useQuery<DeliveryOrder[]>({
    queryKey: ['active-deliveries'],
    queryFn: async () => {
      const res = await api.get('/delivery/active');
      return res.data;
    },
  });

  // Datos financieros para gráfico
  const { data: financialData } = useQuery({
    queryKey: ['financial-chart-data'],
    queryFn: async () => {
      const res = await api.get('/reports/financial');
      return res.data;
    },
  });

  const todayRevenue = stats?.today?.totalRevenue || 0;
  const todayProfit = stats?.today?.grossProfit || 0;
  const monthRevenue = stats?.month?.totalRevenue || 0;
  const monthExpenses = expensesSummary?.month?.total || 0;
  const estimatedNetMonth = monthRevenue - (stats?.month?.totalCost || 0) - monthExpenses;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado y Accesos Directos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Dashboard General</h1>
            <p className="text-sm text-gray-400">
              Monitoreo en tiempo real de operaciones, ventas, inventario y finanzas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white font-semibold text-sm shadow-lg shadow-bk-red/20 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Abrir POS</span>
            </Link>
            <Link
              href="/cash"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bk-card hover:bg-bk-hover border border-bk-border text-gray-200 font-semibold text-sm transition-all"
            >
              <Wallet className="w-4 h-4 text-bk-gold" />
              <span>Caja</span>
            </Link>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ventas Hoy */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ventas de Hoy
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">
              {formatCurrency(todayRevenue)}
            </p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span>{stats?.today?.orderCount || 0} pedidos confirmados hoy</span>
            </p>
          </div>

          {/* Ganancia Bruta Hoy */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ganancia Bruta Hoy
              </span>
              <div className="p-2 rounded-xl bg-bk-gold/10 text-bk-gold border border-bk-gold/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">
              {formatCurrency(todayProfit)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Descontando costo de preparación (CMV)
            </p>
          </div>

          {/* Gastos del Mes */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Gastos del Mes
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">
              {formatCurrency(monthExpenses)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {expensesSummary?.month?.count || 0} registros de gastos en el mes
            </p>
          </div>

          {/* Utilidad Neta Estimada */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Utilidad Neta del Mes
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-2xl font-black mt-3 ${estimatedNetMonth >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(estimatedNetMonth)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Ingresos - Costos de Venta - Gastos
            </p>
          </div>
        </div>

        {/* Gráfico Financiero y Top Productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Evolución Financiera */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Evolución de Ingresos y Gastos</h3>
                <p className="text-xs text-gray-400">Tendencia financiera de operaciones recientes</p>
              </div>
              <span className="px-2.5 py-1 text-xs rounded-lg bg-bk-hover text-bk-gold border border-bk-border font-medium">
                Últimos Días
              </span>
            </div>

            <div className="h-72 w-full">
              {financialData?.chartData && financialData.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialData.chartData}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282c34" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141619', borderColor: '#282c34', borderRadius: '12px', color: '#fff' }}
                      formatter={(val: any) => formatCurrency(Number(val))}
                    />
                    <Area type="monotone" dataKey="ingresos" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                    <Area type="monotone" dataKey="gastos" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" name="Gastos" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                  <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                  <span>Aún no hay datos históricos suficientes para graficar</span>
                </div>
              )}
            </div>
          </div>

          {/* Top 5 Productos más Vendidos */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md flex flex-col">
            <h3 className="text-base font-bold text-white mb-1">Más Vendidos del Mes</h3>
            <p className="text-xs text-gray-400 mb-4">Productos con mayor rotación</p>

            <div className="flex-1 space-y-3">
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-bk-hover border border-bk-border">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-bk-border text-bk-gold text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white line-clamp-1">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.totalQuantity} unidades</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-200">
                      {formatCurrency(p.totalRevenue)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-xs">
                  <span>No hay ventas registradas este mes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección Inferior: Alertas de Inventario y Domicilios Activos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas de Stock Bajo */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Inventario Crítico / Stock Bajo</h3>
              </div>
              <Link href="/inventory" className="text-xs text-bk-red hover:underline font-semibold">
                Ver Kardex
              </Link>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts && lowStockProducts.length > 0 ? (
                lowStockProducts.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div>
                      <p className="text-xs font-bold text-white">{prod.name}</p>
                      <p className="text-[11px] text-gray-400">SKU: {prod.code} • Mínimo: {prod.minStock}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold">
                      {prod.stock} disp.
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">
                  Todos los productos cuentan con niveles de stock óptimos.
                </p>
              )}
            </div>
          </div>

          {/* Domicilios en Curso */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Domicilios Activos</h3>
              </div>
              <Link href="/delivery" className="text-xs text-bk-red hover:underline font-semibold">
                Ver Despacho
              </Link>
            </div>

            <div className="space-y-2.5">
              {activeDeliveries && activeDeliveries.length > 0 ? (
                activeDeliveries.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div>
                      <p className="text-xs font-bold text-white">{d.customerName}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{d.deliveryAddress}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400">
                      {d.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">
                  No hay pedidos pendientes de entrega en este momento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
