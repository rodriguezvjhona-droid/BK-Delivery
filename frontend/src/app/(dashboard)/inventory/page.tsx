'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  X,
  AlertCircle,
  Filter,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { Product, InventoryMovement, InventoryMovementTypeEnum } from '@/types';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'kardex' | 'stock'>('kardex');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<InventoryMovementTypeEnum>(InventoryMovementTypeEnum.IN);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: movements = [], isLoading: loadingMovements } = useQuery<InventoryMovement[]>({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      const res = await api.get('/inventory/movements');
      return res.data;
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const { data: lowStock = [] } = useQuery<Product[]>({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const res = await api.get('/inventory/alerts/low-stock');
      return res.data;
    },
  });

  // Mutación para registrar movimiento manual
  const movementMutation = useMutation({
    mutationFn: async () => {
      return api.post('/inventory/movements', {
        productId: selectedProductId,
        type: movementType,
        quantity: Number(quantity),
        reason,
        referenceId: referenceId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      setIsMovementModalOpen(false);
      setSelectedProductId('');
      setQuantity(1);
      setReason('');
      setReferenceId('');
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al registrar movimiento');
    },
  });

  // Descargar Excel
  const handleDownloadExcel = async () => {
    try {
      const response = await api.get('/reports/inventory/excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'BK_Inventario_Kardex.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Error descargando Excel:', e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Inventario & Kardex</h1>
            <p className="text-sm text-gray-400">
              Control de existencias, deducción atómica de ventas, entradas y ajustes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border border border-bk-border text-xs font-semibold text-emerald-400 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => {
                setErrorMessage(null);
                setIsMovementModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg shadow-bk-red/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Movimiento</span>
            </button>
          </div>
        </div>

        {/* Alerta de Stock Bajo si existe */}
        {lowStock.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">
                  Atención: {lowStock.length} producto(s) con existencias críticas por debajo del umbral mínimo
                </p>
                <p className="text-[11px] text-gray-400">
                  {lowStock.map((p) => `${p.name} (${p.stock} un.)`).join(' • ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('stock')}
              className="text-xs font-bold text-amber-400 hover:underline shrink-0 ml-4"
            >
              Ver Existencias
            </button>
          </div>
        )}

        {/* Pestañas de Vista */}
        <div className="flex items-center gap-3 border-b border-bk-border pb-3">
          <button
            onClick={() => setActiveTab('kardex')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'kardex'
                ? 'bg-bk-red text-white'
                : 'text-gray-400 hover:text-white bg-bk-card'
            }`}
          >
            Historial de Movimientos (Kardex)
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stock'
                ? 'bg-bk-red text-white'
                : 'text-gray-400 hover:text-white bg-bk-card'
            }`}
          >
            Estado Actual de Stock ({products.length})
          </button>
        </div>

        {/* Vista Kardex */}
        {activeTab === 'kardex' && (
          <div className="bg-bk-card border border-bk-border rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                  <tr>
                    <th className="p-4">Fecha / Hora</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-center">Cantidad</th>
                    <th className="p-4 text-center">Stock Previo</th>
                    <th className="p-4 text-center">Nuevo Stock</th>
                    <th className="p-4">Motivo / Justificación</th>
                    <th className="p-4">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bk-border/60">
                  {loadingMovements ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        Cargando historial de movimientos...
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No hay movimientos registrados en el kardex
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      const isPositive =
                        m.type === InventoryMovementTypeEnum.IN ||
                        (m.type === InventoryMovementTypeEnum.ADJUSTMENT && m.newStock > m.previousStock);

                      return (
                        <tr key={m.id} className="hover:bg-bk-hover transition-colors">
                          <td className="p-4 text-gray-400">{formatDate(m.createdAt)}</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                m.type === InventoryMovementTypeEnum.IN
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : m.type === InventoryMovementTypeEnum.SALE
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : m.type === InventoryMovementTypeEnum.OUT
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {m.type === InventoryMovementTypeEnum.IN && <ArrowDownLeft className="w-3 h-3" />}
                              {m.type === InventoryMovementTypeEnum.SALE && <ArrowUpRight className="w-3 h-3" />}
                              {m.type === InventoryMovementTypeEnum.OUT && <ArrowUpRight className="w-3 h-3" />}
                              {m.type === InventoryMovementTypeEnum.ADJUSTMENT && <RefreshCw className="w-3 h-3" />}
                              {m.type}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white">{m.product?.name || 'Producto'}</td>
                          <td className="p-4 text-center font-bold">
                            <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                              {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                            </span>
                          </td>
                          <td className="p-4 text-center text-gray-400">{m.previousStock}</td>
                          <td className="p-4 text-center font-bold text-white">{m.newStock}</td>
                          <td className="p-4 text-gray-300 max-w-xs truncate">{m.reason}</td>
                          <td className="p-4 font-mono text-[11px] text-bk-gold">
                            {m.referenceId || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vista Estado Actual de Stock */}
        {activeTab === 'stock' && (
          <div className="bg-bk-card border border-bk-border rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                  <tr>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-center">Existencias Actuales</th>
                    <th className="p-4 text-center">Stock Mínimo</th>
                    <th className="p-4 text-center">Estado de Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bk-border/60">
                  {products.map((p) => {
                    const isZero = p.stock <= 0;
                    const isLow = p.stock <= p.minStock && !isZero;

                    return (
                      <tr key={p.id} className="hover:bg-bk-hover transition-colors">
                        <td className="p-4 font-mono font-bold text-bk-gold">{p.code}</td>
                        <td className="p-4 font-bold text-white">{p.name}</td>
                        <td className="p-4 text-gray-400">{p.category?.name || '-'}</td>
                        <td className="p-4 text-center font-black text-sm text-white">{p.stock}</td>
                        <td className="p-4 text-center text-gray-400">{p.minStock}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isZero
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isZero ? 'AGOTADO' : isLow ? 'STOCK BAJO' : 'ÓPTIMO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Registro de Movimiento Manual */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Registrar Movimiento de Inventario</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-gray-400 hover:text-white">
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
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Producto Afectado *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Tipo de Movimiento *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType(InventoryMovementTypeEnum.IN)}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      movementType === InventoryMovementTypeEnum.IN
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-bk-hover text-gray-400 border-bk-border'
                    }`}
                  >
                    Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType(InventoryMovementTypeEnum.OUT)}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      movementType === InventoryMovementTypeEnum.OUT
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-bk-hover text-gray-400 border-bk-border'
                    }`}
                  >
                    Salida (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType(InventoryMovementTypeEnum.ADJUSTMENT)}
                    className={`py-2 rounded-lg font-bold text-xs border ${
                      movementType === InventoryMovementTypeEnum.ADJUSTMENT
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                        : 'bg-bk-hover text-gray-400 border-bk-border'
                    }`}
                  >
                    Ajuste (=)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  {movementType === InventoryMovementTypeEnum.ADJUSTMENT
                    ? 'Nuevo Conteo Absoluto de Stock *'
                    : 'Cantidad de Unidades *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Motivo / Justificación *</label>
                <input
                  type="text"
                  placeholder="ej. Compra semanal a distribuidor / Merma / Corrección conteo"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">No. Factura / Comprobante de Soporte</label>
                <input
                  type="text"
                  placeholder="ej. FACT-PROV-10293"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={movementMutation.isPending || !selectedProductId || !reason || quantity <= 0}
                onClick={() => movementMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {movementMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
