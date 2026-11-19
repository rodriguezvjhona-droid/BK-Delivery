'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bike,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  Truck,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { DeliveryOrder, DeliveryStatusEnum, User as UserType, RoleEnum } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const { user, isDelivery } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Consultar pedidos de domicilio
  const { data: orders = [], isLoading: loadingOrders } = useQuery<DeliveryOrder[]>({
    queryKey: ['delivery-orders-list'],
    queryFn: async () => {
      const res = await api.get('/delivery');
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Consultar repartidores (Users con rol DELIVERY)
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['users-drivers-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/users');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const drivers = users.filter((u) => u.role === RoleEnum.DELIVERY || u.role === RoleEnum.ADMIN);

  // Mutación Asignar Repartidor
  const assignMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      return api.patch(`/delivery/${orderId}/assign`, { driverId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders-list'] });
      setIsAssignModalOpen(false);
      setSelectedOrder(null);
    },
  });

  // Mutación Cambiar Estado
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: DeliveryStatusEnum }) => {
      return api.patch(`/delivery/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders-list'] });
    },
  });

  // Agrupar órdenes por estado
  const pendingOrders = orders.filter((o) => o.status === DeliveryStatusEnum.PENDING);
  const assignedOrders = orders.filter((o) => o.status === DeliveryStatusEnum.ASSIGNED);
  const inTransitOrders = orders.filter((o) => o.status === DeliveryStatusEnum.IN_TRANSIT);
  const deliveredOrders = orders.filter((o) => o.status === DeliveryStatusEnum.DELIVERED);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Despacho & Domicilios Express</h1>
            <p className="text-sm text-gray-400">
              Control de pedidos en ruta, asignación de motorizados y estados de entrega en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-2">
              <Bike className="w-4 h-4 animate-bounce" />
              <span>{inTransitOrders.length} pedidos en ruta</span>
            </span>
          </div>
        </div>

        {/* Tablero Kanban de Estados de Entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Columna 1: Pendientes de Asignar */}
          <div className="bg-bk-card border border-bk-border rounded-2xl p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-bk-border mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                1. Pendientes ({pendingOrders.length})
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {pendingOrders.map((order) => (
                <div key={order.id} className="p-3.5 rounded-xl bg-[#111215] border border-bk-border shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-white">{order.customerName}</span>
                    <span className="font-mono text-[10px] text-bk-gold">
                      {order.sale?.invoiceNumber}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-bk-red shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>

                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>{order.customerPhone}</span>
                  </p>

                  <div className="pt-2 border-t border-bk-border flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {formatCurrency(order.sale?.total || 0)}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsAssignModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-bk-red hover:bg-bk-red-light text-white text-[11px] font-bold"
                    >
                      Asignar Repartidor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 2: Asignados / En Cocina */}
          <div className="bg-bk-card border border-bk-border rounded-2xl p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-bk-border mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                2. Asignados ({assignedOrders.length})
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {assignedOrders.map((order) => (
                <div key={order.id} className="p-3.5 rounded-xl bg-[#111215] border border-blue-500/20 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-white">{order.customerName}</span>
                    <span className="font-mono text-[10px] text-bk-gold">
                      {order.sale?.invoiceNumber}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-bk-red shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>

                  <div className="p-2 rounded-lg bg-bk-hover text-[11px] text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-bk-gold" /> {order.driverName}
                    </span>
                    <span className="text-gray-400">{order.estimatedMinutes} min</span>
                  </div>

                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        status: DeliveryStatusEnum.IN_TRANSIT,
                      })
                    }
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Despachar a Ruta</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3: En Tránsito / En Ruta */}
          <div className="bg-bk-card border border-bk-border rounded-2xl p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-bk-border mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                3. En Ruta ({inTransitOrders.length})
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inTransitOrders.map((order) => (
                <div key={order.id} className="p-3.5 rounded-xl bg-[#111215] border border-purple-500/20 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-white">{order.customerName}</span>
                    <span className="font-bold text-xs text-white">
                      {formatCurrency(order.sale?.total || 0)}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-bk-red shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>

                  <div className="p-2 rounded-lg bg-bk-hover text-[11px] text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-purple-300">
                      <Bike className="w-3.5 h-3.5" /> {order.driverName}
                    </span>
                    <span className="text-gray-400">
                      {order.dispatchedAt ? formatDate(order.dispatchedAt).slice(11) : ''}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        orderId: order.id,
                        status: DeliveryStatusEnum.DELIVERED,
                      })
                    }
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 4: Entregados con Éxito */}
          <div className="bg-bk-card border border-bk-border rounded-2xl p-4 flex flex-col h-[650px]">
            <div className="flex items-center justify-between pb-3 border-b border-bk-border mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                4. Entregados ({deliveredOrders.length})
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {deliveredOrders.slice(0, 15).map((order) => (
                <div key={order.id} className="p-3 rounded-xl bg-[#101114] border border-bk-border opacity-70 hover:opacity-100 transition-opacity space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-white">{order.customerName}</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Entregado</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{order.deliveryAddress}</p>
                  <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                    <span>Motorizado: {order.driverName}</span>
                    <span>{order.deliveredAt ? formatDate(order.deliveredAt).slice(11) : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Asignar Repartidor */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Asignar Repartidor a Pedido</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-bk-hover border border-bk-border space-y-1">
                <p><span className="text-gray-400">Cliente:</span> <strong className="text-white">{selectedOrder.customerName}</strong></p>
                <p><span className="text-gray-400">Dirección:</span> {selectedOrder.deliveryAddress}</p>
                <p><span className="text-gray-400">Total a cobrar:</span> <strong className="text-bk-gold">{formatCurrency(selectedOrder.sale?.total || 0)}</strong></p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Seleccionar Repartidor Disponible *
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Seleccione un repartidor...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={assignMutation.isPending || !selectedDriverId}
                onClick={() =>
                  assignMutation.mutate({
                    orderId: selectedOrder.id,
                    driverId: selectedDriverId,
                  })
                }
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
