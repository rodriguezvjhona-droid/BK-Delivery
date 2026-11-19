'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  CheckCircle,
  Printer,
  Bike,
  User,
  X,
  AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { Product, Category, PaymentMethodEnum, Sale } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export default function PosPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);

  // Estados del Modal de Cobro
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerDocument, setCustomerDocument] = useState('222222222222');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(5000);

  // Métodos de pago en Checkout
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState('');
  const [cardAmount, setCardAmount] = useState<number>(0);

  // Estado de venta exitosa para impresión
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consultar categorías
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      const res = await api.get('/categories?onlyActive=true');
      return res.data;
    },
  });

  // Consultar productos activos
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const res = await api.get('/products?onlyActive=true');
      return res.data;
    },
  });

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Manejadores del Carrito
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Límite de stock
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) return item;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setGeneralDiscount(0);
  };

  // Cálculos de Totales
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product.sellingPrice * item.quantity - item.discount,
      0,
    );
  }, [cart]);

  const taxRate = 0.08; // 8% Impoconsumo
  const taxableAmount = Math.max(0, subtotal - generalDiscount);
  const taxAmount = Math.round(taxableAmount * taxRate);
  const totalAmount = taxableAmount + taxAmount + (isDelivery ? deliveryFee : 0);

  // Apertura del modal de cobro con cálculo inicial de efectivo
  const openCheckout = () => {
    setCashAmount(totalAmount);
    setTransferAmount(0);
    setCardAmount(0);
    setErrorMessage(null);
    setIsCheckoutOpen(true);
  };

  const totalPaid = cashAmount + transferAmount + cardAmount;
  const changeAmount = Math.max(0, cashAmount - (totalAmount - transferAmount - cardAmount));

  // Mutación para confirmar venta
  const saleMutation = useMutation({
    mutationFn: async () => {
      const payments = [];
      if (cashAmount > 0) {
        // En efectivo se registra el monto exacto asignado a cubrir la venta
        const effectiveCash = Math.min(cashAmount, totalAmount - transferAmount - cardAmount);
        payments.push({
          method: PaymentMethodEnum.CASH,
          amount: Math.max(0, effectiveCash),
          notes: changeAmount > 0 ? `Pagó con ${formatCurrency(cashAmount)} (Cambio: ${formatCurrency(changeAmount)})` : undefined,
        });
      }
      if (transferAmount > 0) {
        payments.push({
          method: PaymentMethodEnum.TRANSFER,
          amount: transferAmount,
          referenceCode: transferRef || 'TRANSFER-POS',
        });
      }
      if (cardAmount > 0) {
        payments.push({
          method: PaymentMethodEnum.CARD,
          amount: cardAmount,
        });
      }

      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
        payments,
        customerName,
        customerDocument,
        customerPhone: customerPhone || undefined,
        taxRate,
        discountAmount: generalDiscount,
        notes: notes || undefined,
        isDelivery,
      };

      const res = await api.post('/sales', payload);
      const sale = res.data;

      // Si es domicilio, registrar orden de despacho
      if (isDelivery) {
        await api.post('/delivery', {
          saleId: sale.id,
          customerName,
          customerPhone: customerPhone || 'Sin teléfono',
          deliveryAddress,
          deliveryFee,
        });
      }

      return sale;
    },
    onSuccess: (data) => {
      setCompletedSale(data);
      setIsCheckoutOpen(false);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['current-cash-register'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message || 'Error al procesar la venta. Verifique existencias o caja.',
      );
    },
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">
        {/* Panel Izquierdo: Catálogo y Filtros */}
        <div className="flex-1 flex flex-col min-w-0 bg-bk-card border border-bk-border rounded-2xl p-4 overflow-hidden">
          {/* Barra de Búsqueda */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o código (ej. BK-COM-01)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0e10] border border-bk-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-bk-red"
              />
            </div>
          </div>

          {/* Filtros de Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-bk-border scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-bk-red text-white shadow-md'
                  : 'bg-bk-hover text-gray-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-bk-red text-white shadow-md'
                    : 'bg-bk-hover text-gray-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Grilla de Productos */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                Cargando catálogo de productos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
                No se encontraron productos en esta categoría
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((prod) => {
                  const inCart = cart.find((c) => c.product.id === prod.id);
                  const isOutOfStock = prod.stock <= 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && addToCart(prod)}
                      className={`relative flex flex-col justify-between p-3 rounded-xl border transition-all select-none ${
                        isOutOfStock
                          ? 'bg-[#121316] border-bk-border opacity-50 cursor-not-allowed'
                          : 'bg-bk-hover hover:border-bk-red/60 border-bk-border cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {/* Imagen o Placeholder */}
                      <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-[#0a0a0c]">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-bk-gold font-bold text-xs">
                            BK
                          </div>
                        )}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-sm text-gray-200">
                          Stock: {prod.stock}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-bk-gold uppercase tracking-wider">
                          {prod.code}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-bk-border/60">
                        <span className="text-sm font-black text-white">
                          {formatCurrency(prod.sellingPrice)}
                        </span>
                        {inCart && (
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-bk-red text-white text-[10px] font-bold">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Carrito y Totales */}
        <div className="w-full lg:w-96 flex flex-col bg-bk-card border border-bk-border rounded-2xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-bk-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-bk-red" />
              <h3 className="text-base font-bold text-white">Orden Actual</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de Ítems en Carrito */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                <ShoppingCart className="w-12 h-12 mb-2 stroke-1 opacity-30" />
                <p>El carrito está vacío</p>
                <p className="text-xs text-gray-600 mt-1">Selecciona productos para comenzar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-bk-hover border border-bk-border"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatCurrency(item.product.sellingPrice)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-bk-border rounded-lg bg-[#0e0f12]">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:text-white text-gray-400"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:text-white text-gray-400"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-bold text-white w-16 text-right">
                      {formatCurrency(item.product.sellingPrice * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen Financiero de la Orden */}
          <div className="pt-3 border-t border-bk-border space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-200">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Impuesto al Consumo (8%):</span>
              <span className="font-semibold text-gray-200">{formatCurrency(taxAmount)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-blue-400">
                <span>Tarifa Domicilio:</span>
                <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-bk-border">
              <span>TOTAL A COBRAR:</span>
              <span className="text-bk-gold">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={openCheckout}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-bk-red to-bk-red-dark hover:from-bk-red-light hover:to-bk-red text-white font-bold text-sm shadow-lg shadow-bk-red/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar y Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cobro y Pagos Combinados */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-lg font-bold text-white">Procesar Cobro de Venta</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="py-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              {/* Total Destacado */}
              <div className="p-4 rounded-xl bg-bk-hover border border-bk-border text-center">
                <span className="text-xs text-gray-400 uppercase font-semibold">Total Liquidado</span>
                <p className="text-3xl font-black text-bk-gold mt-1">{formatCurrency(totalAmount)}</p>
              </div>

              {/* Datos de Facturación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Doc. / NIT</label>
                  <input
                    type="text"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(e.target.value)}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* ¿Es Domicilio? */}
              <div className="p-3 rounded-xl bg-bk-hover border border-bk-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={isDelivery}
                    onChange={(e) => setIsDelivery(e.target.checked)}
                    className="rounded border-bk-border text-bk-red focus:ring-0"
                  />
                  <span>Marcar para despacho a domicilio</span>
                </label>

                {isDelivery && (
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      placeholder="Dirección de entrega completa..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono del destinatario..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>

              {/* Métodos de Pago Combinados */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Desglose de Pago (Efectivo / Transferencia / Tarjeta)
                </span>

                {/* Efectivo */}
                <div className="p-3 rounded-xl bg-[#0e0f12] border border-bk-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Efectivo Físico
                    </span>
                    <span className="text-[11px] text-gray-400">Va directo a caja</span>
                  </div>
                  <input
                    type="number"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full bg-bk-card border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                  />
                  {changeAmount > 0 && (
                    <p className="text-emerald-400 font-bold mt-1 text-[11px]">
                      Cambio a devolver: {formatCurrency(changeAmount)}
                    </p>
                  )}
                </div>

                {/* Transferencia */}
                <div className="p-3 rounded-xl bg-[#0e0f12] border border-bk-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-400" /> Transferencia (Nequi / Daviplata)
                    </span>
                    <span className="text-[11px] text-gray-400">Separada de caja física</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Monto $..."
                      value={transferAmount || ''}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="bg-bk-card border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="No. comprobante..."
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      className="bg-bk-card border border-bk-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Tarjeta */}
                <div className="p-3 rounded-xl bg-[#0e0f12] border border-bk-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-purple-400" /> Tarjeta Débito / Crédito
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder="Monto $..."
                    value={cardAmount || ''}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-full bg-bk-card border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400">Total cubierto:</span>
                <p className="font-bold text-white">{formatCurrency(totalPaid)}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saleMutation.isPending || totalPaid < totalAmount}
                  onClick={() => saleMutation.mutate()}
                  className="px-5 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {saleMutation.isPending ? 'Confirmando...' : 'Confirmar Venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venta Exitosa con Impresión Inmediata */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 text-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-xl font-black text-white">¡Venta Confirmada con Éxito!</h3>
            <p className="text-xs text-gray-400 mt-1">
              Comprobante No. <span className="text-bk-gold font-bold">{completedSale.invoiceNumber}</span>
            </p>
            <p className="text-2xl font-black text-white my-4">
              {formatCurrency(completedSale.total)}
            </p>

            <div className="p-4 rounded-xl bg-bk-hover border border-bk-border text-left text-xs space-y-1 mb-6">
              <p><span className="text-gray-400">Cliente:</span> {completedSale.customerName}</p>
              <p><span className="text-gray-400">Ítems vendidos:</span> {completedSale.items?.length || 0}</p>
              <p><span className="text-gray-400">Inventario:</span> Descontado automáticamente en Kardex</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  window.open(`/invoices?invoice=${completedSale.invoiceNumber}`, '_blank');
                  setCompletedSale(null);
                }}
                className="w-full py-3 rounded-xl bg-bk-red hover:bg-bk-red-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket Térmico / Factura</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 font-semibold text-xs"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
