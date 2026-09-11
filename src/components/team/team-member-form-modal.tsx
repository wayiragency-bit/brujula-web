'use client';

import { useState, type FormEvent } from 'react';
import { useTeamRoles } from '@/hooks/use-team';
import type { InviteMemberValues, UpdateMemberValues } from '@/hooks/use-team';
import type { TeamMember } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

interface TeamMemberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: InviteMemberValues | UpdateMemberValues) => Promise<unknown>;
  initial?: TeamMember;
}

export function TeamMemberFormModal({ open, onClose, onSubmit, initial }: TeamMemberFormModalProps) {
  const { data: roles } = useTeamRoles();
  const [name, setName] = useState(() => initial?.name ?? '');
  const [email, setEmail] = useState(() => initial?.email ?? '');
  const [phone, setPhone] = useState(() => initial?.phone ?? '');
  const [pickedRoleId, setPickedRoleId] = useState(() => initial?.roles[0]?.id ?? '');
  const [active, setActive] = useState(() => initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Roles arrive asynchronously, so fall back to the first one until the user picks.
  const roleId = pickedRoleId || roles?.[0]?.id || '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (initial) {
        await onSubmit({ name, phone: phone || undefined, roleId: roleId || undefined, active } satisfies UpdateMemberValues);
      } else {
        await onSubmit({ name, email, roleId, phone: phone || undefined } satisfies InviteMemberValues);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el miembro del equipo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} subtitle="Gestión del equipo de ventas y accesos." title={initial ? 'Editar Agente' : 'Nuevo Agente'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="name">Nombre Completo</label>
          <input className={inputClass} id="name" onChange={(e) => setName(e.target.value)} required value={name} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="role">Rol de Usuario</label>
            <select className={selectClass} id="role" onChange={(e) => setPickedRoleId(e.target.value)} value={roleId}>
              {roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Teléfono</label>
            <input className={inputClass} id="phone" onChange={(e) => setPhone(e.target.value)} placeholder="+573001234567" value={phone} />
          </div>
        </div>

        {initial ? (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input checked={active} onChange={(e) => setActive(e.target.checked)} type="checkbox" />
            Cuenta activa
          </label>
        ) : (
          <>
            <div>
              <label className={labelClass} htmlFor="email">Correo Electrónico</label>
              <input className={inputClass} id="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />
            </div>
            <p className="text-xs text-ink-muted">
              Se enviará un enlace a este correo para que el agente cree su propia contraseña.
            </p>
          </>
        )}

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={onClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={submitting} type="submit">
            {submitting ? 'Guardando…' : initial ? 'Guardar Cambios' : 'Registrar Agente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
