'use client';

import {
  BarChart3,
  Bell,
  CalendarDays,
  Compass,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Search,
  Settings,
  Truck,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { label: 'Dashboard',       short: 'Panel',    href: '/',                icon: LayoutDashboard },
  { label: 'Estatus',         short: 'Estatus',  href: '/pipeline',        icon: BarChart3 },
  { label: 'Cotizaciones',    short: 'Cotiza.',  href: '/quotes',          icon: FileText },
  { label: 'Clientes',        short: 'Clientes', href: '/clients',         icon: UsersRound },
  { label: 'Productos',       short: 'Produc.',  href: '/products',        icon: Package },
  { label: 'Calendario PMS',  short: 'Cal.PMS',  href: '/pms',             icon: CalendarDays },
  { label: 'Channel Manager', short: 'Channel',  href: '/channel-manager', icon: Globe },
  { label: 'Proveedores',     short: 'Proveed.', href: '/suppliers',       icon: Truck },
  { label: 'Marketing',       short: 'Market.',  href: '/marketing',       icon: Megaphone },
  { label: 'Equipo',          short: 'Equipo',   href: '/team',            icon: UsersRound },
  { label: 'Config',          short: 'Config',   href: '/settings',        icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'JC';
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <Compass className="h-8 w-8 animate-pulse text-amber" />
          <p className="label-caps text-ink-soft">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center py-4 lg:flex"
             style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-faint)' }}>

        {/* Logo mark */}
        <Link
          aria-label="Brújula"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber transition hover:bg-amber/25"
          href="/"
        >
          <Compass className="h-5 w-5" />
        </Link>

        {/* Nav icons */}
        <nav aria-label="Navegación principal" className="mt-6 flex flex-1 flex-col items-center gap-0.5 w-full px-2">
          {navigation.map(({ label, short, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                aria-label={label}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl py-2 transition-all ${
                  active
                    ? 'bg-amber text-[var(--sidebar-bg)] shadow-[0_0_16px_rgba(254,178,59,0.25)]'
                    : 'text-white/40 hover:bg-white/8 hover:text-white/80'
                }`}
                href={href}
                key={label}
              >
                <Icon className="h-[16px] w-[16px]" />
                <span className="text-[8px] font-medium leading-none tracking-wide">{short}</span>
              </Link>
            );
          })}
        </nav>

        {/* Avatar / logout */}
        <button
          aria-label="Cerrar sesión"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-red-400 transition hover:bg-red-500/15 hover:text-red-300"
          onClick={() => logout().then(() => router.replace('/login'))}
          type="button"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="pointer-events-none absolute left-[64px] z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-paper-elevated px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-floating transition-opacity group-hover:opacity-100"
                style={{ border: '1px solid var(--border)' }}>
            Cerrar sesión
          </span>
        </button>
      </aside>

      {/* ── CONTENT AREA ── */}
      <div className="lg:pl-[76px]">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-6"
                style={{
                  background: 'var(--topbar-bg)',
                  backdropFilter: 'blur(12px)',
                  borderBottom: '1px solid var(--border-faint)',
                }}>

          {/* Mobile: logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Compass className="h-5 w-5 text-amber" />
            <span className="font-display text-base font-bold text-ink">Brújula</span>
          </div>

          {/* Search bar */}
          <div className="hidden flex-1 max-w-sm sm:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                className="h-8 w-full rounded-lg pl-8 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-amber/30"
                placeholder="Buscar cotizaciones, clientes…"
                readOnly
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                type="search"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications (visual only) */}
            <button
              aria-label="Notificaciones"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-white/8 hover:text-ink"
              type="button"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber" />
            </button>

            {/* User info */}
            <div className="hidden flex-col items-end sm:flex">
              <p className="text-sm font-semibold leading-none text-ink">{user.name}</p>
              <p className="mt-0.5 text-[11px] leading-none text-ink-soft">{user.roles[0]?.name ?? 'Miembro'}</p>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold text-amber/90"
              style={{ background: 'color-mix(in srgb, var(--teal) 70%, transparent)', border: '1px solid rgba(254,178,59,0.25)' }}
            >
              {initials(user.name)}
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>

      {/* ── MOBILE NAV BAR ── */}
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
        style={{
          background: 'var(--mobile-nav-bg)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {navigation.slice(0, 5).map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
                active ? 'text-amber' : 'text-ink-muted'
              }`}
              href={href}
              key={label}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-amber' : ''}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
