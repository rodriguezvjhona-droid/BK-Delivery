'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  DollarSign,
  Smartphone,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  AlertTriangle,
  History,
  X,
  AlertCircle,
  Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CashRegister, CashMovement, PaymentMethodEnum } from '@/types';

export default function CashPage() {
  const queryClient = useQueryClient();
  const [isOpenModalActive, setIsOpenModalActive] = useState(false);
  const [isCloseModalActive, setIsCloseModalActive] = useState(false);
  const [isMovementModalActive, setIsMovementModalActive] = useState(false);

  // Estados de formularios
  const [openingBalance, setOpeningBalance] = useState<number>(100000);
  const [openNotes, setOpenNotes] = useState('');
  const [actualCash, setActualCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');

  // Movimiento manual
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [movementAmount, setMovementAmount] = useState<number>(0);
  const [movementDesc, setMovementDesc] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: openRegister, isLoading: loadingRegister } = useQuery<CashRegister | null>({
    queryKey: ['current-cash-register'],
    queryFn: async () => {
      const res = await api.get('/cash-register/current');
      return res.data;
    },
  });

  const { data: history = [] } = useQuery<CashRegister[]>({
    queryKey: ['cash-history'],
    queryFn: async () => {
      const res = await api.get('/cash-register/history');
      return res.data;
    },
  });

  // Mutación para Abrir Caja
  const openMutation = useMutation({
    mutationFn: async () => {
      return api.post('/cash-register/open', {
        openingBalance: Number(openingBalance),
        notes: openNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-register'] });
      queryClient.invalidateQueries({ queryKey: ['cash-history'] });
      setIsOpenModalActive(false);
      setOpenNotes('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al abrir caja');
    },
  });

  // Mutación para Cerrar Caja
  const closeMutation = useMutation({
    mutationFn: async () => {
      return api.post('/cash-register/close', {
        actualCash: Number(actualCash),
        notes: closeNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-register'] });
      queryClient.invalidateQueries({ queryKey: ['cash-history'] });
      setIsCloseModalActive(false);
      setActualCash(0);
      setCloseNotes('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al cerrar caja');
    },
  });

  // Mutación para Movimiento Manual
  const movementMutation = useMutation({
    mutationFn: async () => {
      return api.post('/cash-register/movement', {
        type: movementType,
        amount: Number(movementAmount),
        description: movementDesc,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-cash-register'] });
      setIsMovementModalActive(false);
      setMovementAmount(0);
      setMovementDesc('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al registrar movimiento');
    },
  });

  const expectedCash = openRegister ? Number(openRegister.expectedCash) : 0;
  const difference = actualCash - expectedCash;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Control de Caja & Arqueo</h1>
            <p className="text-sm text-gray-400">
              Apertura de turno, arqueo ciego, auditoría de efectivo y separación de transferencias.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {openRegister ? (
              <>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setIsMovementModalActive(true);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border border border-bk-border text-xs font-semibold text-white transition-all"
                >
                  <Plus className="w-4 h-4 text-bk-gold" />
                  <span>Movimiento Manual</span>
                </button>
                <button
                  onClick={() => {
                    setActualCash(expectedCash);
                    setErrorMessage(null);
                    setIsCloseModalActive(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>Cerrar Turno de Caja</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setIsOpenModalActive(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Turno de Caja</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado en Vivo de la Caja Abierta */}
        {openRegister ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Base Inicial */}
              <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Base Inicial de Apertura
                </span>
                <p className="text-2xl font-black text-white mt-2">
                  {formatCurrency(openRegister.openingBalance)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Abierta: {formatDate(openRegister.openingDate)}
                </p>
              </div>

              {/* Ventas en Efectivo */}
              <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Ventas en Efectivo
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {formatCurrency(openRegister.cashSales)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Ingreso físico a cajón</p>
              </div>

              {/* Ventas Electrónicas (SEPARADAS DE LA CAJA) */}
              <div className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Transferencias (Nequi/Banco)
                  </span>
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-black text-blue-400 mt-2">
                  {formatCurrency(openRegister.transferSales)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  Separado estrictamente: NO suma al efectivo físico
                </p>
              </div>

              {/* Saldo Esperado en Efectivo */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-bk-card to-[#1a1b22] border-2 border-bk-gold/40 shadow-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-bk-gold">
                  Efectivo Físico Esperado
                </span>
                <p className="text-3xl font-black text-white mt-2">
                  {formatCurrency(openRegister.expectedCash)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Base + Ventas Efectivo + Ingresos - Egresos
                </p>
              </div>
            </div>

            {/* Movimientos del Turno Actual */}
            <div className="bg-bk-card border border-bk-border rounded-2xl p-5 shadow-md">
              <h3 className="text-base font-bold text-white mb-4">
                Movimientos Registrados en el Turno Actual
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                    <tr>
                      <th className="p-3">Hora</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3">Método</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bk-border/60">
                    {openRegister.movements && openRegister.movements.length > 0 ? (
                      openRegister.movements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-bk-hover">
                          <td className="p-3 text-gray-400">{formatDate(mov.createdAt)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mov.type === 'INCOME'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {mov.type === 'INCOME' ? 'INGRESO' : 'EGRESO'}
                            </span>
                          </td>
                          <td className="p-3 text-white font-medium">{mov.description}</td>
                          <td className="p-3">
                            <span className="text-[11px] font-mono text-gray-300">
                              {mov.paymentMethod}
                            </span>
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              mov.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {mov.type === 'INCOME' ? '+' : '-'} {formatCurrency(mov.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">
                          No hay movimientos registrados en este turno
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-bk-card border border-bk-border text-center">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No hay ningún turno de caja abierto</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-2">
              Para registrar ventas en efectivo y controlar arqueos, debe iniciar la jornada abriendo un nuevo turno de caja.
            </p>
            <button
              onClick={() => setIsOpenModalActive(true)}
              className="mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Abrir Turno de Caja Ahora
            </button>
          </div>
        )}

        {/* Historial de Cierres de Turnos */}
        <div className="bg-bk-card border border-bk-border rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-bk-gold" />
            <h3 className="text-base font-bold text-white">Historial de Turnos y Arqueos Cerrados</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                <tr>
                  <th className="p-3">Apertura</th>
                  <th className="p-3">Cierre</th>
                  <th className="p-3 text-right">Base</th>
                  <th className="p-3 text-right">Ventas Efectivo</th>
                  <th className="p-3 text-right">Transferencias</th>
                  <th className="p-3 text-right">Esperado</th>
                  <th className="p-3 text-right">Contado</th>
                  <th className="p-3 text-right">Diferencia</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bk-border/60">
                {history.map((reg) => (
                  <tr key={reg.id} className="hover:bg-bk-hover">
                    <td className="p-3 text-gray-400">{formatDate(reg.openingDate)}</td>
                    <td className="p-3 text-gray-400">{formatDate(reg.closingDate || '')}</td>
                    <td className="p-3 text-right text-gray-300">{formatCurrency(reg.openingBalance)}</td>
                    <td className="p-3 text-right text-emerald-400">{formatCurrency(reg.cashSales)}</td>
                    <td className="p-3 text-right text-blue-400">{formatCurrency(reg.transferSales)}</td>
                    <td className="p-3 text-right font-bold text-white">{formatCurrency(reg.expectedCash)}</td>
                    <td className="p-3 text-right font-bold text-white">
                      {reg.actualCash !== undefined ? formatCurrency(reg.actualCash) : '-'}
                    </td>
                    <td
                      className={`p-3 text-right font-bold ${
                        (reg.difference || 0) < 0
                          ? 'text-red-400'
                          : (reg.difference || 0) > 0
                          ? 'text-emerald-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {reg.difference !== undefined ? formatCurrency(reg.difference) : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-bk-hover text-gray-400">
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Apertura de Caja */}
      {isOpenModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Apertura de Turno de Caja</h3>
              <button onClick={() => setIsOpenModalActive(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Monto Base Inicial en Efectivo *
                </label>
                <input
                  type="number"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Observaciones / Turno</label>
                <input
                  type="text"
                  placeholder="ej. Turno Mañana / Base entregada por supervisor"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsOpenModalActive(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={openMutation.isPending || openingBalance < 0}
                onClick={() => openMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {openMutation.isPending ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja y Arqueo Físico */}
      {isCloseModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Cierre de Caja & Arqueo Físico</h3>
              <button onClick={() => setIsCloseModalActive(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="py-4 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-bk-hover border border-bk-border text-center">
                <span className="text-[11px] text-gray-400 uppercase font-semibold">Efectivo Físico Esperado</span>
                <p className="text-2xl font-black text-white mt-1">{formatCurrency(expectedCash)}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Efectivo Físico Real Contado en Cajón *
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold text-lg text-center"
                />
              </div>

              {/* Diferencia Calculada */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  difference === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : difference > 0
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                <span className="font-semibold">
                  {difference === 0
                    ? 'Arqueo Cuadrado Exacto'
                    : difference > 0
                    ? 'Sobrante en Caja'
                    : 'Faltante en Caja'}
                </span>
                <span className="text-sm font-black">{formatCurrency(difference)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Observaciones de Cierre</label>
                <input
                  type="text"
                  placeholder="ej. Turno finalizado sin discrepancias"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsCloseModalActive(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={closeMutation.isPending || actualCash < 0}
                onClick={() => closeMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre Definitivo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento Manual */}
      {isMovementModalActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Movimiento Manual de Caja</h3>
              <button onClick={() => setIsMovementModalActive(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('INCOME')}
                  className={`py-2 rounded-lg font-bold border ${
                    movementType === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-bk-hover text-gray-400 border-bk-border'
                  }`}
                >
                  Ingreso Extra (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('EXPENSE')}
                  className={`py-2 rounded-lg font-bold border ${
                    movementType === 'EXPENSE'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-bk-hover text-gray-400 border-bk-border'
                  }`}
                >
                  Egreso / Retiro (-)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Monto en Efectivo *</label>
                <input
                  type="number"
                  min="1"
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Concepto / Motivo *</label>
                <input
                  type="text"
                  placeholder="ej. Compra de bolsas / Cambio de sencillo"
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsMovementModalActive(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={movementMutation.isPending || !movementDesc || movementAmount <= 0}
                onClick={() => movementMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {movementMutation.isPending ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
