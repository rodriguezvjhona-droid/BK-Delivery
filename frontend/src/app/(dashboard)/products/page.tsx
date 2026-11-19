'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  UtensilsCrossed,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/formatters';
import { Product, Category } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Modal de Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [categoryId, setCategoryId] = useState('');

  // Modal de Categoría
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Mutación de Producto (Crear / Editar)
  const productMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code,
        name,
        description,
        imageUrl: imageUrl || undefined,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minStock: Number(minStock),
        categoryId,
      };

      if (editingProduct) {
        return api.patch(`/products/${editingProduct.id}`, payload);
      } else {
        return api.post('/products', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      setIsProductModalOpen(false);
      resetProductForm();
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al guardar el producto');
    },
  });

  // Mutación de Categoría
  const categoryMutation = useMutation({
    mutationFn: async () => {
      return api.post('/categories', {
        name: categoryName,
        description: categoryDesc,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al guardar la categoría');
    },
  });

  const resetProductForm = () => {
    setEditingProduct(null);
    setCode('');
    setName('');
    setDescription('');
    setImageUrl('');
    setCostPrice(0);
    setSellingPrice(0);
    setStock(0);
    setMinStock(5);
    setCategoryId('');
    setErrorMessage(null);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setCategoryId(p.categoryId);
    setErrorMessage(null);
    setIsProductModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Catálogo y Categorías</h1>
            <p className="text-sm text-gray-400">
              Administración de productos, recetas, precios de venta y categorías.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCategoryName('');
                  setCategoryDesc('');
                  setErrorMessage(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-bk-hover hover:bg-bk-border border border-bk-border text-xs font-semibold text-white transition-all"
              >
                <Tag className="w-4 h-4 text-bk-gold" />
                <span>Nueva Categoría</span>
              </button>

              <button
                onClick={() => {
                  resetProductForm();
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg shadow-bk-red/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          )}
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex items-center gap-3 border-b border-bk-border pb-3">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-bk-red text-white'
                : 'text-gray-400 hover:text-white bg-bk-card'
            }`}
          >
            Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-bk-red text-white'
                : 'text-gray-400 hover:text-white bg-bk-card'
            }`}
          >
            Categorías ({categories.length})
          </button>
        </div>

        {/* Vista de Productos */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bk-card border border-bk-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-bk-red"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full sm:w-56 bg-bk-card border border-bk-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-bk-red"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-bk-card border border-bk-border rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                    <tr>
                      <th className="p-4">Producto</th>
                      <th className="p-4">SKU / Código</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-right">Costo (CMV)</th>
                      <th className="p-4 text-right">Precio Venta</th>
                      <th className="p-4 text-center">Existencias</th>
                      <th className="p-4 text-center">Estado</th>
                      {isAdmin && <th className="p-4 text-center">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bk-border/60">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          Cargando catálogo...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No se encontraron productos coincidentes
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-bk-hover transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0d0e10] shrink-0 border border-bk-border">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-bk-gold font-bold text-xs">
                                  BK
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white line-clamp-1">{p.name}</p>
                              <p className="text-[11px] text-gray-400 line-clamp-1">{p.description}</p>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-bk-gold">{p.code}</td>
                          <td className="p-4 text-gray-300">{p.category?.name || '-'}</td>
                          <td className="p-4 text-right text-gray-400">{formatCurrency(p.costPrice)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatCurrency(p.sellingPrice)}</td>
                          <td className="p-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                p.stock <= 0
                                  ? 'bg-red-500/20 text-red-400'
                                  : p.stock <= p.minStock
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {p.stock} un.
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-bk-hover text-gray-300">
                              {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleEditProduct(p)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-bk-border"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Categorías */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 rounded-2xl bg-bk-card border border-bk-border shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bk-hover text-bk-gold border border-bk-border">
                    {cat.products?.length || 0} productos
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{cat.description || 'Sin descripción'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Crear / Editar Producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="py-4 space-y-3.5 max-h-[65vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="BK-COM-05"
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Categoría *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Salchicha Frankfurt con Chucrut"
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descripción / Receta</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles de preparación o ingredientes..."
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Costo (CMV) *</label>
                  <input
                    type="number"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Precio de Venta *</label>
                  <input
                    type="number"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Existencias Iniciales *</label>
                  <input
                    type="number"
                    value={stock || ''}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={minStock || ''}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={productMutation.isPending || !code || !name || !categoryId}
                onClick={() => productMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {productMutation.isPending ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Categoría */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Nueva Categoría de Menú</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white">
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
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nombre de Categoría *</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Postres Alemanes"
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  rows={2}
                  placeholder="Descripción del grupo de platos o bebidas..."
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-bk-border flex justify-end gap-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-bk-hover hover:bg-bk-border text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                disabled={categoryMutation.isPending || !categoryName}
                onClick={() => categoryMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {categoryMutation.isPending ? 'Creando...' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
