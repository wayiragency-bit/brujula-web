import Link from 'next/link';
import {
  BarChart3,
  Compass,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  UsersRound,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, active: true },
  { label: 'Estatus', href: '/pipeline', icon: BarChart3 },
  { label: 'Cotizaciones', href: '/quotes', icon: FileText },
  { label: 'Clientes', href: '/clients', icon: UsersRound },
  { label: 'Config', href: '/settings', icon: Settings },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col items-center bg-teal py-5 text-paper lg:flex">
        <Link aria-label="Brújula" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#feb23b]" href="/">
          <Compass className="h-6 w-6" />
        </Link>
        <nav aria-label="Navegación principal" className="mt-10 flex flex-1 flex-col gap-3">
          {navigation.map(({ label, href, icon: Icon, active }) => (
            <Link
              aria-label={label}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
                active ? 'bg-[#feb23b] text-teal' : 'text-paper/65 hover:bg-white/10 hover:text-paper'
              }`}
              href={href}
              key={label}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-14 rounded-md bg-ink px-2 py-1 text-xs text-paper opacity-0 shadow-lg transition group-hover:opacity-100">
                {label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#feb23b] font-mono text-xs font-bold text-teal">JC</div>
      </aside>

      <div className="lg:pl-[72px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/5 bg-paper/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Abrir menú" className="rounded-lg p-2 text-teal lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <Compass className="h-6 w-6 text-teal lg:hidden" />
            <Link className="font-display text-xl font-extrabold text-teal" href="/">Brújula</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">Juan Carcamo</p>
              <p className="text-xs text-ink-soft">Administrador</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal font-mono text-xs font-bold text-[#a0d0ca]">JC</div>
          </div>
        </header>
        <main>{children}</main>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-ink/10 bg-paper/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        {navigation.map(({ label, href, icon: Icon, active }) => (
          <Link
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] transition ${
              active ? 'bg-teal text-[#feb23b]' : 'text-ink-soft'
            }`}
            href={href}
            key={label}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
