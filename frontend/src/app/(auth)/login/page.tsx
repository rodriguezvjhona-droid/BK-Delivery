'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Mail, AlertCircle, Shield, ArrowRight, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const loginSchema = z.object({
  email: z.string().email('Ingrese un correo electronico valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@bkdelivery.com',
      password: 'Admin123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken, user } = response.data;
      login(accessToken, user);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        e.response?.data?.message || 'Error al iniciar sesion. Verifique sus credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'admin' | 'cajero' | 'repartidor') => {
    if (role === 'admin') {
      setValue('email', 'admin@bkdelivery.com');
      setValue('password', 'Admin123!');
    } else if (role === 'cajero') {
      setValue('email', 'cajero@bkdelivery.com');
      setValue('password', 'Cajero123!');
    } else if (role === 'repartidor') {
      setValue('email', 'repartidor@bkdelivery.com');
      setValue('password', 'Repartidor123!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bk-bg via-[#121417] to-bk-bg p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Tarjeta de Login */}
        <div className="bg-bk-card border border-bk-border rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-bk-red via-bk-red-dark to-bk-gold flex items-center justify-center shadow-lg mb-4 text-white font-black text-2xl tracking-tighter">
              BK
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white text-center">
              BK DELIVERY
            </h2>
            <p className="text-xs font-semibold uppercase tracking-widest text-bk-gold mt-1">
              Plataforma Empresarial Gastronomica
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Correo Electronico Corporativo
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@bkdelivery.com"
                  className="w-full bg-[#0a0b0d] border border-bk-border rounded-xl px-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-bk-red focus:ring-1 focus:ring-bk-red text-sm transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Contrasena de Seguridad
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0b0d] border border-bk-border rounded-xl px-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-bk-red focus:ring-1 focus:ring-bk-red text-sm transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-bk-red to-bk-red-dark hover:from-bk-red-light hover:to-bk-red text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Accesos rapidos de prueba */}
          <div className="mt-8 pt-6 border-t border-bk-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center mb-3">
              Cuentas demo para verificacion
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="px-2 py-2 rounded-lg bg-bk-hover hover:bg-bk-border text-gray-300 hover:text-white text-xs font-medium border border-bk-border transition-all flex flex-col items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-bk-red" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('cajero')}
                className="px-2 py-2 rounded-lg bg-bk-hover hover:bg-bk-border text-gray-300 hover:text-white text-xs font-medium border border-bk-border transition-all flex flex-col items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-bk-gold" />
                <span>Cajero</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('repartidor')}
                className="px-2 py-2 rounded-lg bg-bk-hover hover:bg-bk-border text-gray-300 hover:text-white text-xs font-medium border border-bk-border transition-all flex flex-col items-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Domicilios</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          BK Delivery Enterprise 2026. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
