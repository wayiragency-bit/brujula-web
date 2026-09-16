'use client';

import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  Compass,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Hotel,
  LineChart,
  LogOut,
  Megaphone,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  Truck,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { TrialExpiredScreen } from '@/components/billing/trial-expired-screen';
import { Modal } from '@/components/ui/modal';

const navigation = [
  { label: 'Dashboard',       href: '/',                icon: LayoutDashboard, permission: undefined },
  { label: 'Estatus',         href: '/pipeline',        icon: BarChart3,       permission: undefined },
  { label: 'Cotizaciones',    href: '/quotes',          icon: FileText,        permission: undefined },
  { label: 'Clientes',        href: '/clients',         icon: UsersRound,      permission: undefined },
  { label: 'Productos',       href: '/products',        icon: Package,        permission: 'products.view' },
  { label: 'Calendario PMS',  href: '/pms',             icon: CalendarDays,    permission: 'pms.view' },
  { label: 'Channel Manager', href: '/channel-manager', icon: Globe,           permission: 'channels.view' },
  { label: 'Proveedores',     href: '/suppliers',       icon: Truck,           permission: 'products.view' },
  { label: 'Marketing',       href: '/marketing',       icon: Megaphone,       permission: 'marketing.view' },
  { label: 'Equipo',          href: '/team',            icon: UsersRound,      permission: 'team.view' },
  { label: 'Configuración',   href: '/settings',        icon: Settings,        permission: undefined },
];

// Manager On Vacation: a global user (agency === null), never a tenant — sees a completely
// different, read-only nav pointed at /manager/* instead of the per-agency modules above.
const managerNavigation = [
  { label: 'Dashboard',      href: '/manager',              icon: LayoutDashboard, permission: 'on_vacation.dashboard_view' },
  { label: 'Pipeline',       href: '/manager/pipeline',     icon: BarChart3,       permission: 'on_vacation.pipeline_view' },
  { label: 'Cotizaciones',   href: '/manager/quotes',       icon: FileText,        permission: 'on_vacation.quotes_view' },
  { label: 'Analítica',      href: '/manager/analytics',    icon: LineChart,       permission: 'on_vacation.analytics_view' },
  { label: 'Clientes',       href: '/manager/clients',      icon: UsersRound,      permission: 'on_vacation.clients_view' },
  { label: 'Asesores',       href: '/manager/advisors',     icon: UsersRound,      permission: 'on_vacation.advisors_view' },
  { label: 'Suscripciones',  href: '/manager/subscriptions', icon: CreditCard,     permission: 'on_vacation.subscriptions_view' },
  { label: 'Catálogo',       href: '/manager/catalog',      icon: Hotel,           permission: 'catalog.manage' },
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
  const { user, status, logout, hasPermission } = useAuth();

  // Sidebar icon tooltips are portaled to <body> instead of positioned relative to the icon:
  // the nav list needs its own vertical scroll as a safety net on short screens, and any
  // ancestor with overflow-y set forces overflow-x to be clipped too (per the CSS overflow
  // spec), which would silently cut off a tooltip that pops out to the right of the rail.
  const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; top: number } | null>(null);
  const [showMoreNav, setShowMoreNav] = useState(false);
  function showSidebarTooltip(e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>, label: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setSidebarTooltip({ label, top: rect.top + rect.height / 2 });
  }
  function hideSidebarTooltip() {
    setSidebarTooltip(null);
  }

  // A Manager account has no agency of its own — that's how we tell it apart from a tenant user.
  const isManager = user !== null && user !== undefined && user.agency === null;
  const activeNavigation = isManager ? managerNavigation : navigation;
  const visibleNav = activeNavigation.filter((item) => !item.permission || hasPermission(item.permission));
  // Bottom bar has room for 5 slots. When there are more items than that, keep the first 4 and
  // collapse the rest behind a "Más" sheet instead of silently truncating (that's how Catálogo
  // used to disappear for the Manager, whose nav has 8 items).
  const mobileNavOverflows = visibleNav.length > 5;
  const primaryMobileNav = mobileNavOverflows ? visibleNav.slice(0, 4) : visibleNav;
  const overflowMobileNav = mobileNavOverflows ? visibleNav.slice(4) : [];
  const subscription = user?.subscription ?? null;
  // No subscription row (agencies created before this feature) is never blocked — only EXPIRED/CANCELLED are.
  const subscriptionBlocked = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED';
  const trialDaysLeft = subscription?.status === 'TRIAL' && subscription.trialEnd
    ? Math.ceil((new Date(subscription.trialEnd).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const showTrialReminder = trialDaysLeft !== null && trialDaysLeft <= 7;

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  // Hiding the nav item is not real security (the API already enforces it) — this redirect just
  // keeps a user from landing on a blank/erroring page for a module their role can't see.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const home = isManager ? '/manager' : '/';
    const restricted = activeNavigation.find((item) => item.permission && isActive(pathname, item.href));
    if (restricted && !hasPermission(restricted.permission!)) router.replace(home);
  }, [status, pathname, hasPermission, router, isManager, activeNavigation]);

  // A Manager has no agency — the per-agency pages (/, /pipeline, /quotes...) call endpoints that
  // assume one and would just come back empty. Likewise a normal tenant user has no business under
  // /manager. Keep each on their own route tree.
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (isManager && !pathname.startsWith('/manager')) router.replace('/manager');
    if (!isManager && pathname.startsWith('/manager')) router.replace('/');
  }, [status, pathname, isManager, router]);

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

  if (subscriptionBlocked) return <TrialExpiredScreen />;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ── SIDEBAR (desktop) — icon-only rail with hover tooltips.
           Fixed, comfortably legible sizes at every viewport height instead of
           shrinking with vh-based clamp(); the nav list scrolls on its own if a
           very short screen or a future longer menu ever needs more room than
           it has, rather than compressing icons/text below a readable size. ── */}
      <aside className="glass-panel fixed top-4 bottom-4 left-4 z-40 hidden w-[76px] flex-col items-center py-4 rounded-2xl lg:flex">

        {/* Logo mark */}
        <Link
          aria-label="Chatiza"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber/15 text-amber transition hover:bg-amber/25"
          href="/"
        >
          <Compass className="h-6 w-6" />
        </Link>

        {/* Nav icons */}
        <nav aria-label="Navegación principal" className="mt-6 flex min-h-0 w-full flex-1 flex-col items-center justify-start gap-1.5 overflow-y-auto overflow-x-hidden px-2">
          {visibleNav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                aria-label={label}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-amber text-[var(--sidebar-bg)] shadow-[0_0_16px_rgba(254,178,59,0.25)]'
                    : 'text-[var(--sidebar-nav-text)] hover:bg-[var(--sidebar-nav-hover-bg)] hover:text-[var(--sidebar-nav-text-active)]'
                }`}
                href={href}
                key={label}
                onBlur={hideSidebarTooltip}
                onFocus={(e) => showSidebarTooltip(e, label)}
                onMouseEnter={(e) => showSidebarTooltip(e, label)}
                onMouseLeave={hideSidebarTooltip}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          aria-label="Cerrar sesión"
          className="mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-400 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]"
          onBlur={hideSidebarTooltip}
          onClick={() => logout().then(() => router.replace('/login'))}
          onFocus={(e) => showSidebarTooltip(e, 'Cerrar sesión')}
          onMouseEnter={(e) => showSidebarTooltip(e, 'Cerrar sesión')}
          onMouseLeave={hideSidebarTooltip}
          type="button"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Sidebar tooltip — portaled to <body> so it's never clipped by the nav's own scroll container */}
      {sidebarTooltip && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-lg"
              style={{ left: 100, top: sidebarTooltip.top, background: 'var(--paper-elevated)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              {sidebarTooltip.label}
            </div>,
            document.body,
          )
        : null}

      {/* ── CONTENT AREA ── */}
      <div className="lg:pl-[108px]">

        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-6"
                style={{
                  background: 'var(--topbar-bg)',
                  backdropFilter: 'blur(12px)',
                  borderBottom: '1px solid var(--border-faint)',
                }}>

          {/* Mobile: logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Compass className="h-5 w-5 text-amber" />
            <span className="font-display text-base font-bold text-ink">Chatiza</span>
          </div>

          {/* Search bar */}
          <div className="hidden flex-1 max-w-md sm:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                className="h-10 w-full rounded-xl pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-amber/30"
                placeholder="Buscar cotizaciones, clientes…"
                readOnly
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                type="search"
              />
            </div>
          </div>

          {/* Trial reminder — inline in header, between search and actions */}
          {showTrialReminder ? (
            <Link
              className="hidden shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:brightness-110 sm:flex"
              href="/settings"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#b45309' }}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {trialDaysLeft && trialDaysLeft > 0
                  ? `Prueba: ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'} restante${trialDaysLeft === 1 ? '' : 's'}`
                  : 'Prueba: termina hoy'}
              </span>
            </Link>
          ) : null}

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications (visual only) */}
            <button
              aria-label="Notificaciones"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-white/8 hover:text-ink"
              type="button"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber" />
            </button>

            {/* User info */}
            <div className="hidden flex-col items-end sm:flex">
              <p className="text-sm font-semibold leading-none text-ink">{user.name}</p>
              <p className="mt-0.5 text-xs leading-none text-ink-soft">{user.roles[0]?.name ?? 'Miembro'}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-xs font-bold text-amber/90"
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
        {primaryMobileNav.map(({ label, href, icon: Icon }) => {
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
        {mobileNavOverflows ? (
          <button
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition ${
              overflowMobileNav.some((item) => isActive(pathname, item.href)) ? 'text-amber' : 'text-ink-muted'
            }`}
            onClick={() => setShowMoreNav(true)}
            type="button"
          >
            <MoreHorizontal className={`h-5 w-5 ${overflowMobileNav.some((item) => isActive(pathname, item.href)) ? 'text-amber' : ''}`} />
            <span className="truncate">Más</span>
          </button>
        ) : null}
      </nav>

      {/* Mobile "Más" sheet — holds whatever didn't fit in the 5 bottom-bar slots */}
      <Modal onClose={() => setShowMoreNav(false)} open={showMoreNav} title="Más opciones">
        <div className="grid grid-cols-3 gap-3">
          {overflowMobileNav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-xs font-semibold transition ${
                  active ? 'border-amber bg-amber/10 text-amber' : 'border-ink/10 text-ink-soft hover:bg-ink/5'
                }`}
                href={href}
                key={label}
                onClick={() => setShowMoreNav(false)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
