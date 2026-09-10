import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brújula — Cotizaciones que sí llegan a destino',
  description: 'Cotizador y operación comercial para agencias de viajes.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
