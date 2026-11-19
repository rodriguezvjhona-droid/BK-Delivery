'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Printer,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Sale } from '@/types';

// ── Componente interno que usa useSearchParams (requiere Suspense) ──────────
function InvoicesContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialInvoice = searchParams.get('invoice') || '';

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState(initialInvoice);
  const [printProfile, setPrintProfile] = useState<'80mm' | '58mm' | 'commercial'>('80mm');
  const [dianModalOpen, setDianModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dianData, setDianData] = useState<any>(null);

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ['sales-invoices-list'],
    queryFn: async () => {
      const res = await api.get('/sales');
      return res.data;
    },
  });

  useEffect(() => {
    if (!selectedInvoiceNumber && sales.length > 0) {
      setSelectedInvoiceNumber(sales[0].invoiceNumber);
    }
  }, [sales, selectedInvoiceNumber]);

  const { data: invoiceData } = useQuery({
    queryKey: ['invoice-details', selectedInvoiceNumber],
    queryFn: async () => {
      if (!selectedInvoiceNumber) return null;
      const res = await api.get(`/invoices/${selectedInvoiceNumber}`);
      return res.data;
    },
    enabled: !!selectedInvoiceNumber,
  });

  const recordPrintMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/invoices/${selectedInvoiceNumber}/print-log`, {
        profile: `THERMAL_${printProfile.toUpperCase()}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-details', selectedInvoiceNumber] });
      window.print();
    },
  });

  const fetchDianPayload = async () => {
    try {
      const res = await api.get(`/invoices/${selectedInvoiceNumber}/dian-payload`);
      setDianData(res.data);
      setDianModalOpen(true);
    } catch (e) {
      console.error('Error obteniendo payload DIAN:', e);
    }
  };

  const sale = invoiceData?.sale;
  const business = invoiceData?.business;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Facturacion &amp; Centro de Impresion
          </h1>
          <p className="text-sm text-gray-400">
            Comprobantes comerciales, tickets termicos configurables y enlace DIAN independiente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-bk-card border border-bk-border rounded-xl">
            {(['80mm', '58mm', 'commercial'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPrintProfile(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  printProfile === p ? 'bg-bk-red text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '80mm' ? 'Termica 80 mm' : p === '58mm' ? 'Termica 58 mm' : 'Comercial 8.5x13'}
              </button>
            ))}
          </div>

          <button
            onClick={() => recordPrintMutation.mutate()}
            disabled={!sale}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg shadow-bk-red/20 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>

      {/* Panel de trabajo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista lateral */}
        <div className="no-print bg-bk-card border border-bk-border rounded-2xl p-4 flex flex-col h-[650px]">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-bk-gold" />
            <span>Comprobantes Emitidos ({sales.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sales.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedInvoiceNumber(s.invoiceNumber)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedInvoiceNumber === s.invoiceNumber
                    ? 'bg-bk-hover border-bk-red text-white'
                    : 'bg-[#101114] border-bk-border text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-bk-gold">{s.invoiceNumber}</span>
                  <span className="font-bold text-xs text-white">{formatCurrency(s.total)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="truncate max-w-[140px]">{s.customerName}</span>
                  <span>{formatDate(s.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-bk-border mt-3">
            <button
              onClick={fetchDianPayload}
              disabled={!selectedInvoiceNumber}
              className="w-full py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border border border-bk-border text-gray-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Auditar Payload DIAN Canonico</span>
            </button>
          </div>
        </div>

        {/* Vista previa de impresion */}
        <div className="lg:col-span-2 flex justify-center">
          {sale && business ? (
            <div
              className={`bg-white text-black font-mono shadow-2xl transition-all duration-300 ${
                printProfile === '80mm'
                  ? 'w-[320px] p-4 text-[12px] print-ticket-80mm'
                  : printProfile === '58mm'
                  ? 'w-[240px] p-3 text-[10px] print-ticket-58mm'
                  : 'w-full max-w-xl p-8 text-sm print-letter-commercial'
              }`}
            >
              {/* Cabecera */}
              <div className="text-center pb-3 border-b border-dashed border-gray-400">
                <h2 className="font-black text-base tracking-tight uppercase">{business.name}</h2>
                <p className="font-bold text-xs">NIT: {business.nit}</p>
                <p className="text-[11px]">{business.address}</p>
                <p className="text-[11px]">Tel: {business.phone}</p>
                <p className="text-[10px] text-gray-700 mt-1">{business.regime}</p>
                <p className="text-[9px] text-gray-600 mt-0.5">{business.resolution}</p>
              </div>

              {/* Datos de la venta */}
              <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>COMPROBANTE NO:</span>
                  <span>{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="uppercase">{sale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>DOC / NIT:</span>
                  <span>{sale.customerDocument}</span>
                </div>
                {sale.customerPhone && (
                  <div className="flex justify-between">
                    <span>TELEFONO:</span>
                    <span>{sale.customerPhone}</span>
                  </div>
                )}
                {invoiceData.isReprint && (
                  <div className="text-center font-bold text-red-600 pt-1 text-[10px]">
                    *** REIMPRESION AUTORIZADA (Copia #{invoiceData.reprintCount}) ***
                  </div>
                )}
              </div>

              {/* Productos */}
              <div className="py-2.5 border-b border-dashed border-gray-400">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-400 text-[10px] font-bold">
                      <th className="pb-1">DESCRIPCION</th>
                      <th className="pb-1 text-center">CANT</th>
                      <th className="pb-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-gray-300">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {sale.items.map((item: any) => (
                      <tr key={item.id} className="text-[11px]">
                        <td className="py-1 pr-1">
                          <span className="font-bold">{item.productName}</span>
                          <span className="block text-[9px] text-gray-600">
                            @{formatCurrency(item.unitPrice)}
                          </span>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right font-bold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>DESCUENTO:</span>
                    <span>-{formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IMPOCONSUMO (8%):</span>
                  <span>{formatCurrency(sale.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-1 border-t border-gray-400">
                  <span>TOTAL PAGAR:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
              </div>

              {/* Metodos de pago */}
              <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-0.5">
                <span className="font-bold block">FORMA DE PAGO:</span>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {sale.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between">
                    <span className="uppercase">
                      {p.method} {p.referenceCode ? `(${p.referenceCode})` : ''}:
                    </span>
                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Pie de pagina */}
              <div className="text-center pt-3 text-[10px] space-y-1">
                <p className="font-bold italic">{business.footerMessage}</p>
                <p className="text-[9px] text-gray-600">Impreso por Sistema BK Delivery Enterprise</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-sm">
              <FileText className="w-12 h-12 mb-3 stroke-1 opacity-40" />
              <span>Seleccione un comprobante para visualizar su formato de impresion</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal DIAN */}
      {dianModalOpen && dianData && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-bk-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Payload Canonico DIAN Desacoplado</h3>
              </div>
              <button onClick={() => setDianModalOpen(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                {dianData.notice}
              </div>
              <pre className="bg-[#0c0d0f] border border-bk-border rounded-xl p-4 text-[11px] font-mono text-gray-300 max-h-80 overflow-y-auto">
                {JSON.stringify(dianData.dianDocument, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-bk-border flex justify-end">
              <button
                onClick={() => setDianModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-white text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagina exportada con Suspense obligatorio por useSearchParams ────────────
export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Cargando facturacion...
          </div>
        }
      >
        <InvoicesContent />
      </Suspense>
    </DashboardLayout>
  );
}
