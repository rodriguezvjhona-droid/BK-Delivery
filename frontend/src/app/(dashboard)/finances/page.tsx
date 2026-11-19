'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { FinancialReport } from '@/types';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function FinancesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: report, isLoading } = useQuery<FinancialReport>({
    queryKey: ['financial-report', startDate, endDate],
    queryFn: async () => {
      let url = '/reports/financial';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await api.get(url);
      return res.data;
    },
  });

  const paymentData = report?.paymentMethods
    ? [
        { name: 'Efectivo', value: report.paymentMethods.CASH || 0 },
        { name: 'Transferencia', value: report.paymentMethods.TRANSFER || 0 },
        { name: 'Tarjeta', value: report.paymentMethods.CARD || 0 },
        { name: 'Otros', value: report.paymentMethods.OTHER || 0 },
      ].filter((p) => p.value > 0)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado y Filtro de Fechas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Finanzas & Rentabilidad Real</h1>
            <p className="text-sm text-gray-400">
              Análisis contable riguroso: Ingresos Brutos vs Costo CMV vs Gastos Operativos = Utilidad Neta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-bk-card border border-bk-border rounded-xl px-3 py-2 text-xs text-white"
            />
            <span className="text-gray-500 text-xs">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-bk-card border border-bk-border rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Tarjetas Principales del Estado de Resultados (P&L) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Ingresos Totales */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              (1) Ingresos Brutos
            </span>
            <p className="text-2xl font-black text-white mt-2">
              {formatCurrency(report?.totalRevenue || 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {report?.salesCount || 0} ventas confirmadas
            </p>
          </div>

          {/* 2. Costo de Venta CMV */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              (2) Costo de Mercancía (CMV)
            </span>
            <p className="text-2xl font-black text-amber-400 mt-2">
              -{formatCurrency(report?.totalCostOfGoodsSold || 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Costo de insumos de los platos vendidos
            </p>
          </div>

          {/* 3. Gastos Operativos */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              (3) Gastos Operacionales
            </span>
            <p className="text-2xl font-black text-red-400 mt-2">
              -{formatCurrency(report?.totalExpenses || 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Servicios, arriendos, nómina y varios
            </p>
          </div>

          {/* 4. Utilidad Neta Real */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-bk-card to-[#191922] border-2 border-emerald-500/40 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                (4) Utilidad Neta Real
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400">
                {report?.netMarginPercentage || 0}% Margen
              </span>
            </div>
            <p
              className={`text-3xl font-black mt-2 ${
                (report?.netProfit || 0) >= 0 ? 'text-white' : 'text-red-400'
              }`}
            >
              {formatCurrency(report?.netProfit || 0)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Ganancia líquida final del negocio
            </p>
          </div>
        </div>

        {/* Gráficos Financieros */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras: Comparativa Ingresos vs Costos vs Gastos */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <h3 className="text-base font-bold text-white mb-1">
              Estructura de Ingresos vs Costos y Gastos
            </h3>
            <p className="text-xs text-gray-400 mb-4">Desglose comparativo por día de operación</p>

            <div className="h-80 w-full">
              {report?.chartData && report.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282c34" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141619', borderColor: '#282c34', borderRadius: '12px', color: '#fff' }}
                      formatter={(val: any) => formatCurrency(Number(val))}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos Venta" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="costos" fill="#f59e0b" name="Costo CMV" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#dc2626" name="Gastos Operativos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                  Sin transacciones suficientes en el rango seleccionado
                </div>
              )}
            </div>
          </div>

          {/* Gráfico Circular: Distribución por Método de Pago */}
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Métodos de Cobro</h3>
              <p className="text-xs text-gray-400 mb-4">Participación del efectivo vs transferencias</p>

              <div className="h-56 w-full flex items-center justify-center">
                {paymentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-gray-500">Sin datos de cobro</p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-bk-border">
              {paymentData.map((p, i) => (
                <div key={p.name} className="flex justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {p.name}:
                  </span>
                  <span className="font-bold text-white">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
