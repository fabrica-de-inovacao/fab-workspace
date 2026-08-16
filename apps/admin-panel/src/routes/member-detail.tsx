import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useMember, useMemberStatus, useResetWifiPassword, useRoles, useUpdateMember, useWifiPassword } from '../hooks/use-members.js'
import { ConfirmDialog } from '../components/confirm-dialog.js'
import { BottomSheet } from '../components/bottom-sheet.js'
import { SkeletonCard, StatusBadge } from '../components/feedback.js'

export function MemberDetailPage() {
  const { memberId } = useParams({ from: '/authenticated/members/$memberId' })
  const member = useMember(memberId)
  const status = useMemberStatus(memberId, member.data?.data.active ?? true)
  const wifi = useWifiPassword(memberId)
  const resetWifi = useResetWifiPassword(memberId)
  const updateMember = useUpdateMember(memberId)
  const roles = useRoles()
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  if (member.isPending) return <div className="min-h-full p-6"><div className="mx-auto max-w-3xl"><SkeletonCard /></div></div>
  if (member.error) return <p className="p-8 text-error">{member.error.message}</p>

  const data = member.data.data

  async function toggleStatus() {
    try {
      const result = await status.mutateAsync()
      if (result.data.wifiPassword) setRevealedPassword(result.data.wifiPassword)
      toast.success(data.active ? 'Membro inativado' : 'Membro reativado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  async function revealWifi() {
    const result = await wifi.refetch()
    setRevealedPassword(result.data?.data.password ?? null)
  }

  async function resetPassword() {
    try {
      const result = await resetWifi.mutateAsync()
      setRevealedPassword(result.data.wifiPassword)
      toast.success('Senha Wi-Fi redefinida')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao redefinir senha')
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await updateMember.mutateAsync({
        name: String(form.get('name')),
        email: String(form.get('email')),
        cpf: String(form.get('cpf')).replace(/\D/g, '') || null,
        phone: String(form.get('phone')) || null,
        roleId: Number(form.get('roleId')),
      })
      setEditing(false)
      toast.success('Dados do membro atualizados')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar membro')
    }
  }

  return (
    <main className="min-h-full p-4 sm:p-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
        <Link to="/members" className="text-sm text-primary">Voltar para membros</Link>
        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {data.image ? <img src={data.image} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">{data.name[0]}</div>}
            <div><h1 className="text-2xl font-light tracking-tight text-ink">{data.name}</h1><p className="mt-1 text-sm text-ink-muted">{data.email}</p></div>
          </div>
          <StatusBadge active={data.active} />
        </div>

        <div className="mt-8 rounded-xl bg-surface-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-light text-ink">Dados do membro</h2>
            {!editing && <button onClick={() => setEditing(true)} className="text-sm text-primary">Editar</button>}
          </div>
          {editing ? (
            <form onSubmit={saveProfile} className="mt-5 grid gap-5 sm:grid-cols-2">
              <EditField label="Nome" name="name" defaultValue={data.name} required />
              <EditField label="Email" name="email" type="email" defaultValue={data.email} required />
              <EditField label="CPF" name="cpf" defaultValue={data.cpf ?? ''} />
              <EditField label="Telefone" name="phone" defaultValue={data.phone ?? ''} />
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs text-ink-muted">Perfil</span><select name="roleId" required defaultValue={data.userRoles[0]?.roleId ?? ''} className="w-full rounded-lg border border-hairline-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary">{roles.data?.data.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
              <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setEditing(false)} className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted">Cancelar</button><button disabled={updateMember.isPending} className="rounded-full bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">{updateMember.isPending ? 'Salvando...' : 'Salvar'}</button></div>
            </form>
          ) : (
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Info label="CPF" value={data.cpf ?? 'Não informado'} />
              <Info label="Telefone" value={data.phone ?? 'Não informado'} />
              <Info label="Perfil" value={data.userRoles[0]?.role.name ?? 'Sem perfil'} />
              <Info label="Limite Wi-Fi" value={data.userRoles[0]?.role.wifiRateLimit ?? 'Sem limite'} />
            </dl>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-hairline p-5">
          <h2 className="text-lg font-light text-ink">Acesso Wi-Fi</h2>
          <p className="mt-1 text-sm text-ink-muted">Senha individual usada pelo FreeRADIUS.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="min-w-48 rounded-lg bg-surface-soft px-3 py-2 text-sm">{revealedPassword ?? '••••••••••••'}</code>
            <BottomSheet trigger={<button disabled={!data.active} onClick={revealWifi} className="rounded-full border border-primary px-4 py-2 text-sm text-primary disabled:opacity-40">Revelar</button>} title="Senha Wi-Fi"><div className="rounded-xl bg-surface-soft p-5 text-center"><p className="text-xs text-ink-muted">Senha atual</p><code className="mt-2 block break-all text-lg text-ink">{revealedPassword ?? 'Carregando...'}</code></div></BottomSheet>
            <button onClick={resetPassword} disabled={!data.active || resetWifi.isPending} className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted disabled:opacity-40">Redefinir</button>
          </div>
        </div>

        <footer className="mt-8 flex justify-end">
          {data.active ? <ConfirmDialog trigger={<button disabled={status.isPending} className="rounded-full border border-error px-4 py-2.5 text-sm text-error">Inativar membro</button>} title="Inativar membro?" description="O acesso Wi-Fi será revogado imediatamente. O cadastro continuará disponível para reativação." confirmLabel="Inativar" onConfirm={toggleStatus} destructive /> : <button onClick={toggleStatus} disabled={status.isPending} className="rounded-full bg-primary px-4 py-2.5 text-sm text-white">{status.isPending ? 'Salvando...' : 'Reativar membro'}</button>}
        </footer>
      </section>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-normal text-ink-muted">{label}</dt><dd className="mt-1 text-sm text-ink">{value}</dd></div>
}

function EditField(props: { label: string; name: string; defaultValue: string; type?: string; required?: boolean }) {
  return <label><span className="mb-1.5 block text-xs text-ink-muted">{props.label}</span><input {...props} className="w-full rounded-lg border border-hairline-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary" /></label>
}
