import { useState, useEffect } from 'react'
import { Pencil, ShieldOff, ShieldCheck, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useMemberStatus, useRoles, useUpdateMember, useWifiProfiles } from '../hooks/use-members.js'
import type { Member } from '../lib/api.js'
import { Drawer } from './drawer.js'
import { FormSelect } from './form-select.js'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administração',
  coordenador: 'Coordenação',
  membro: 'Membro',
}

function translateRole(name: string | undefined) {
  if (!name) return 'Sem perfil'
  return ROLE_LABELS[name] ?? name
}

function formatCpf(cpf: string | null) {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? '—'
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  )
}

export type MemberDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  defaultEdit?: boolean
  onRefresh?: () => void
}

export function MemberDetailDrawer({ open, onOpenChange, member, defaultEdit = false, onRefresh }: MemberDetailDrawerProps) {
  const roles = useRoles()
  const wifiProfiles = useWifiProfiles()
  const updateMember = useUpdateMember(member?.id ?? '')
  const toggleStatus = useMemberStatus(member?.id ?? '', member?.active ?? true)

  const [editing, setEditing] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState('')
  const [wifiProfileId, setWifiProfileId] = useState('')

  // Sincronizar modo edição com defaultEdit ao abrir
  useEffect(() => {
    if (open && member) {
      if (defaultEdit) {
        enterEdit()
      } else {
        setEditing(false)
      }
    }
  }, [open, member?.id, defaultEdit])

  function enterEdit() {
    if (!member) return
    setName(member.name)
    setEmail(member.email)
    setCpf(member.cpf ?? '')
    setPhone(member.phone ?? '')
    setRoleId(member.userRoles[0]?.roleId != null ? String(member.userRoles[0].roleId) : '')
    setWifiProfileId(member.wifiProfileId != null ? String(member.wifiProfileId) : '')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function handleSave() {
    if (!member) return
    try {
      await updateMember.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.replace(/\D/g, '') || null,
        phone: phone.replace(/\D/g, '') || null,
        roleId: Number(roleId),
        wifiProfileId: wifiProfileId ? Number(wifiProfileId) : null,
      })
      setEditing(false)
      toast.success('Dados atualizados com sucesso')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar')
    }
  }

  async function handleToggleStatus() {
    if (!member) return
    try {
      await toggleStatus.mutateAsync()
      toast.success(member.active ? 'Membro inativado' : 'Membro reativado')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  function handleClose() {
    setEditing(false)
    onOpenChange(false)
  }

  if (!member) return null

  const inputBase = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50'
  const inputIdle = 'border-hairline-input focus:border-primary'

  return (
    <>
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setEditing(false)
        }
        onOpenChange(v)
      }}
      title={editing ? 'Editar membro' : member.name}
      subtitle={editing ? member.email : undefined}
      size="lg"
      footer={
        editing ? (
          <>
            <button
              type="button"
              onClick={cancelEdit}
              className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMember.isPending}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Check size={14} />
              {updateMember.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            className="h-9 w-full rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Fechar
          </button>
        )
      }
    >
      <div className="space-y-5">
        {/* Header com avatar e toggle edição */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {member.image ? (
              <img src={member.image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg text-primary">
                {member.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-lg font-normal text-ink">{member.name}</p>
              <p className="text-sm text-ink-muted">{member.email}</p>
            </div>
          </div>
          {!editing && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setConfirmBlock(true)}
                disabled={toggleStatus.isPending}
                className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                  member.active
                    ? 'text-ink-muted hover:bg-error-soft hover:text-error'
                    : 'text-ink-muted hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                aria-label={member.active ? 'Bloquear acesso' : 'Reativar acesso'}
                title={member.active ? 'Bloquear acesso' : 'Reativar acesso'}
              >
                {member.active ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
              </button>
              <button
                type="button"
                onClick={enterEdit}
                className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-soft hover:text-primary"
                aria-label="Editar membro"
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Modo visualização */}
        {!editing && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="CPF" value={formatCpf(member.cpf)} />
              <InfoItem label="Telefone" value={member.phone ?? 'Não informado'} />
              <InfoItem label="Perfil de acesso" value={translateRole(member.userRoles[0]?.role.name)} />
              <InfoItem label="Perfil de rede" value={member.wifiProfile?.name ?? 'Padrão (Ilimitado)'} />
              <InfoItem label="Status" value={member.active ? 'Ativo' : 'Inativo'} />
              <InfoItem label="Cadastrado em" value={new Date(member.createdAt).toLocaleDateString('pt-BR')} />
            </div>
          </>
        )}

        {/* Modo edição */}
        {editing && (
          <div className="space-y-4">
            <FormField label="Nome completo" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputBase} ${inputIdle} h-9`}
              />
            </FormField>

            <FormField label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputBase} ${inputIdle} h-9`}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="CPF" optional>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className={`${inputBase} ${inputIdle} h-9`}
                />
              </FormField>

              <FormField label="Telefone" optional>
                <input
                  type="text"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={`${inputBase} ${inputIdle} h-9`}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Perfil de acesso" required>
                <FormSelect
                  value={roleId}
                  onChange={setRoleId}
                  placeholder="Selecione"
                  options={roles.data?.data.map((r) => ({ value: r.id.toString(), label: r.name })) ?? []}
                />
              </FormField>

              <FormField label="Perfil Wi-Fi" optional>
                <FormSelect
                  value={wifiProfileId}
                  onChange={setWifiProfileId}
                  placeholder="Padrão (sem limite)"
                  options={wifiProfiles.data?.data.map((p) => ({ value: p.id.toString(), label: `${p.name}${p.wifiRateLimit ? ` (${p.wifiRateLimit})` : ''}` })) ?? []}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </Drawer>

    {/* Confirmação de bloqueio/reativação */}
    {confirmBlock && member && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setConfirmBlock(false)} />
        <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
          <h2 className="text-xl font-light tracking-tight text-ink">
            {member.active ? 'Bloquear acesso?' : 'Reativar acesso?'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {member.active
              ? `O acesso Wi-Fi de ${member.name} será revogado imediatamente.`
              : `Deseja reativar o acesso Wi-Fi de ${member.name}?`}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmBlock(false)}
              className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggleStatus.isPending}
              className={`rounded-full px-4 py-2 text-sm text-white disabled:opacity-60 ${
                member.active ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {toggleStatus.isPending ? 'Processando...' : member.active ? 'Bloquear' : 'Reativar'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

function FormField({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-ink-muted">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-ink-muted/60">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}
