import type { Metadata } from 'next';
import '@/styles/globals.css';
import QueryProvider from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'BK Delivery — Sistema Empresarial de Comidas y Domicilios',
  description: 'Gestión integral de ventas, punto de venta, inventario, finanzas, caja y domicilios con tecnología empresarial.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
