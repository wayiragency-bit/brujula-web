import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  compact?: boolean;
}

/** Shared empty-state for tables and dashboard panels — replaces bare "no results" text with an icon, message and next action. */
export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12'}`}>
      <div
        className={`flex items-center justify-center rounded-full ${compact ? 'h-9 w-9' : 'h-12 w-12'}`}
        style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
      >
        <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>
      <div className="space-y-1">
        <p className={`font-semibold text-ink ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
        {description ? <p className="max-w-xs text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action ? (
        action.href ? (
          <Link className="button-secondary mt-1 text-xs" href={action.href}>
            {action.label}
          </Link>
        ) : (
          <button className="button-secondary mt-1 text-xs" onClick={action.onClick} type="button">
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
