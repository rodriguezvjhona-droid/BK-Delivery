'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  BarChart2,
  Boxes,
  Receipt,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';

export default function ReportsPage() {
  const [salesStartDate, setSalesStartDate] = useState('');
  const [salesEndDate, setSalesEndDate] = useState('');
  const [downloadingSales, setDownloadingSales] = useState(false);
  const [downloadingInv, setDownloadingInv] = useState(false);

  const downloadSalesExcel = async () => {
    setDownloadingSales(true);
    try {
      let url = '/reports/sales/excel';
      const params = new URLSearchParams();
      if (salesStartDate) params.append('startDate', salesStartDate);
      if (salesEndDate) params.append('endDate', salesEndDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'BK_Historico_Ventas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Error al descargar reporte de ventas:', e);
    } finally {
      setDownloadingSales(false);
    }
  };

  const downloadInventoryExcel = async () => {
    setDownloadingInv(true);
    try {
      const response = await api.get('/reports/inventory/excel', { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'BK_Inventario_Valorizado.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Error al descargar reporte de inventario:', e);
    } finally {
      setDownloadingInv(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Centro de Exportación de Reportes</h1>
          <p className="text-sm text-gray-400">
            Descarga de matrices analíticas en Microsoft Excel (.xlsx) y balances contables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Reporte de Ventas */}
          <div className="p-6 rounded-2xl bg-bk-card border border-bk-border shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reporte General de Ventas (Excel)</h3>
                  <p className="text-xs text-gray-400">Comprobantes, clientes, impuestos, CMV y utilidad bruta</p>
                </div>
              </div>

              <div className="space-y-3 my-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Desde Fecha</label>
                    <input
                      type="date"
                      value={salesStartDate}
                      onChange={(e) => setSalesStartDate(e.target.value)}
                      className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Hasta Fecha</label>
                    <input
                      type="date"
                      value={salesEndDate}
                      onChange={(e) => setSalesEndDate(e.target.value)}
                      className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={downloadSalesExcel}
              disabled={downloadingSales}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingSales ? 'Generando Excel...' : 'Exportar Ventas (.xlsx)'}</span>
            </button>
          </div>

          {/* Tarjeta Reporte de Inventario */}
          <div className="p-6 rounded-2xl bg-bk-card border border-bk-border shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-bk-red/10 text-bk-red border border-bk-red/20">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kardex e Inventario Valorizado (Excel)</h3>
                  <p className="text-xs text-gray-400">Stock actual, costo unitario, valorización total y alertas</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bk-hover border border-bk-border text-xs text-gray-300 my-4 space-y-1">
                <p>• Incluye valorización total al costo ($ CMV).</p>
                <p>• Incluye proyección total a precio de venta.</p>
                <p>• Diagnóstico automático de productos en stock bajo.</p>
              </div>
            </div>

            <button
              onClick={downloadInventoryExcel}
              disabled={downloadingInv}
              className="w-full py-3 rounded-xl bg-bk-red hover:bg-bk-red-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingInv ? 'Generando Excel...' : 'Exportar Inventario (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
