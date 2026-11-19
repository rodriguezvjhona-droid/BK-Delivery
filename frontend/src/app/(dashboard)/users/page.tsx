'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  Bike,
  X,
  AlertCircle,
  Key,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { User, RoleEnum } from '@/types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleEnum>(RoleEnum.EMPLOYEE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      return api.post('/users', {
        fullName,
        email,
        phone: phone || undefined,
        password,
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole(RoleEnum.EMPLOYEE);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Error al crear usuario');
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gestión de Usuarios & Roles</h1>
            <p className="text-sm text-gray-400">
              Administración de personal operativo, cajeros y domiciliarios del sistema.
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
            <span>Crear Usuario</span>
          </button>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-bk-card border border-bk-border rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e0f12] text-gray-400 uppercase tracking-wider font-semibold border-b border-bk-border">
                <tr>
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4 text-center">Rol Asignado</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bk-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Cargando lista de usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-bk-hover transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-bk-border text-bk-gold flex items-center justify-center font-bold text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <span>{u.fullName}</span>
                      </td>
                      <td className="p-4 text-gray-300">{u.email}</td>
                      <td className="p-4 text-gray-400">{u.phone || '-'}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            u.role === RoleEnum.ADMIN
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : u.role === RoleEnum.DELIVERY
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {u.role === RoleEnum.ADMIN && <Shield className="w-3 h-3" />}
                          {u.role === RoleEnum.DELIVERY && <Bike className="w-3 h-3" />}
                          {u.role === RoleEnum.EMPLOYEE && <UserCheck className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-bk-card border border-bk-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-bk-border">
              <h3 className="text-base font-bold text-white">Registrar Nuevo Usuario</h3>
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
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="ej. Klaus Schneider"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  placeholder="klaus@bkdelivery.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="+57 310 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Contraseña Inicial *</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Rol en el Sistema *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleEnum)}
                  className="w-full bg-[#0d0e10] border border-bk-border rounded-lg px-3 py-2 text-white"
                >
                  <option value={RoleEnum.EMPLOYEE}>EMPLOYEE (Cajero / Operador POS)</option>
                  <option value={RoleEnum.DELIVERY}>DELIVERY (Repartidor / Motorizado)</option>
                  <option value={RoleEnum.ADMIN}>ADMIN (Administrador Completo)</option>
                </select>
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
                disabled={createUserMutation.isPending || !fullName || !email || password.length < 6}
                onClick={() => createUserMutation.mutate()}
                className="px-5 py-2 rounded-xl bg-bk-red hover:bg-bk-red-light text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
