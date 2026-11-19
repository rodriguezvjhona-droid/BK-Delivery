'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  User,
  Filter,
  X,
  AlertCircle,
  FileText,
  Tag,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Expense, PaymentMethodEnum } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('Materia Prima e Insumos');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses-list'],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const res = await api.get('/expenses/summary');
      return res.data;
    },
  });

  const { data: suggestedCategories = [] } = useQuery<string[]>({
    queryKey: ['expenses-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data;
    },
  });

  // Mutación
  const expenseMutation = useMutation({
    mutationFn: async () => {
      return api.post('/expenses', {
        category,
        description,
        amount: Number(amount),
        paymentMethod,
        receiptUrl: receiptUrl || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['current-cash-register'] });
      setIsModalOpen(false);
      setDescription('');
      setAmount(0);
      setReceiptUrl('');
      setNotes('');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al registrar el gasto');
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gastos del Negocio</h1>
            <p className="text-sm text-gray-400">
              Control de compras operacionales, insumos, servicios y deducción en caja.
            </p>
          </div>

          <button
            onClick={() => {
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg shadow-bk-red/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Gasto</span>
          </button>
        </div>

        {/* Resumen de Gastos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Gastos de la Semana
            </span>
            <p className="text-2xl font-black text-white mt-2">
              {formatCurrency(summary?.week?.total || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {summary?.week?.count || 0} comprobantes registrados
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Gastos del Mes
            </span>
            <p className="text-2xl font-black text-red-400 mt-2">
              {formatCurrency(summary?.month?.total || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Total acumulado del periodo contable
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Mayor Rubro de Gasto
            </span>
            {summary?.byCategory && summary.byCategory.length > 0 ? (
              <div className="mt-2">
                <p className="text-sm font-bold text-bk-gold line-clamp-1">
                  {summary.byCategory[0].category}
                </p>
                <p className="text-xs text-gray-300 font-semibold mt-0.5">
                  {formatCurrency(summary.byCategory[0].total)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2">Sin gastos registrados este mes</p>
            )}
          </div>
        </div>

        {/* Tabla de Gastos */}
        <div className="bg-bk-card border border-bk-border rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Descripción</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Responsable</th>
                  <th className="p-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bk-border/60">
                {loadingExpenses ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Cargando historial de gastos...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay gastos registrados en el sistema
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-bk-hover transition-colors">
                      <td className="p-4 text-gray-400">{formatDate(e.date)}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-bk-hover text-bk-gold font-medium border border-bk-border">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white max-w-xs truncate">
                        {e.description}
                        {e.notes && <span className="block text-[11px] text-gray-400 font-normal">{e.notes}</span>}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-bk-hover text-gray-300">
                          {e.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{e.responsibleName}</td>
                      <td className="p-4 text-right font-black text-red-400 text-sm">
                        -{formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Registrar Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Registrar Gasto del Negocio</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Categoría de Gasto *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                >
                  {suggestedCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descripción del Gasto *</label>
                <input
                  type="text"
                  placeholder="ej. Pago recibo energía del local / Insumos panadería"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Monto Pagado ($) *</label>
                <input
                  type="number"
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Método de Pago Utilizado *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodEnum)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={PaymentMethodEnum.CASH}>Efectivo Físico (Descuenta de Caja Abierta)</option>
                  <option value={PaymentMethodEnum.TRANSFER}>Transferencia Bancaria / Billetera</option>
                  <option value={PaymentMethodEnum.CARD}>Tarjeta Débito/Crédito Corporativa</option>
                  <option value={PaymentMethodEnum.OTHER}>Otro Medio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">URL de Comprobante / Foto Recibo</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="ej. Pagado a don Carlos / Factura #9872"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={expenseMutation.isPending || !description || amount <= 0}
                onClick={() => expenseMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {expenseMutation.isPending ? 'Guardando...' : 'Registrar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
