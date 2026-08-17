import { useState } from 'react'
import { Check, Copy, Mail, Send, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateInvitation, useCreateMember, useRoles, useWifiProfiles } from '../hooks/use-members.js'
import { Drawer } from './drawer.js'
import { FormSelect } from './form-select.js'

export type NewMemberDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type FormErrors = {
  name?: string | undefined
  email?: string | undefined
  cpf?: string | undefined
  phone?: string | undefined
  roleId?: string | undefined
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function FormField({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string | undefined
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-ink-muted">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-ink-muted/60">(opcional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputBase = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50'
const inputIdle = 'border-hairline-input focus:border-primary'
const inputError = 'border-red-500 bg-red-50/30'

export function NewMemberDrawer({ open, onOpenChange, onSuccess }: NewMemberDrawerProps) {
  const roles = useRoles()
  const wifiProfiles = useWifiProfiles()
  const createMember = useCreateMember()
  const createInvitation = useCreateInvitation()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [wifiProfileId, setWifiProfileId] = useState<string>('')

  const [errors, setErrors] = useState<FormErrors>({})
  const [submittingDirect, setSubmittingDirect] = useState(false)
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [inviteOnlyMode, setInviteOnlyMode] = useState(false)
  const [createdResult, setCreatedResult] = useState<{ wifiPassword?: string; inviteLink?: string } | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const defaultMemberRoleId = roles.data?.data.find((r) => r.name === 'membro')?.id.toString() ?? ''
  const selectedRoleId = roleId || defaultMemberRoleId

  // Botão "Gerar Convite" só fica habilitado com email + nome + perfil de acesso
  const canGenerateInvite = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && name.trim().length > 0 && !!selectedRoleId

  function validate() {
    const errs: FormErrors = {}
    if (!email.trim()) errs.email = 'Obrigatório.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Email inválido.'
    if (!name.trim()) errs.name = 'Obrigatório.'
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf && cleanCpf.length !== 11) errs.cpf = 'Deve ter 11 dígitos.'
    if (!selectedRoleId) errs.roleId = 'Selecione um perfil.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleDirectCreate() {
    if (!validate()) return
    setSubmittingDirect(true)
    try {
      const result = await createMember.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.replace(/\D/g, '') || null,
        phone: phone.replace(/\D/g, '') || null,
        roleId: Number(selectedRoleId),
        wifiProfileId: wifiProfileId ? Number(wifiProfileId) : null,
      })
      setCreatedResult({ wifiPassword: result.data.wifiPassword })
      toast.success('Membro cadastrado e Wi-Fi provisionado!')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar membro')
    } finally {
      setSubmittingDirect(false)
    }
  }

  async function handleGenerateInvite() {
    if (!canGenerateInvite) return
    setSubmittingInvite(true)
    try {
      const result = await createInvitation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.replace(/\D/g, '') || null,
        phone: phone.replace(/\D/g, '') || null,
        roleId: Number(selectedRoleId),
        wifiProfileId: wifiProfileId ? Number(wifiProfileId) : null,
        sendEmail: true,
      })
      setInviteOnlyMode(true)
      setCreatedResult({ inviteLink: result.data.inviteLink })
      toast.success('Convite gerado e enviado via Resend!')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar convite')
    } finally {
      setSubmittingInvite(false)
    }
  }

  function resetForm() {
    setEmail('')
    setName('')
    setCpf('')
    setPhone('')
    setRoleId('')
    setWifiProfileId('')
    setErrors({})
    setCreatedResult(null)
    setInviteOnlyMode(false)
    setCopiedLink(false)
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  function copyInviteLink() {
    if (createdResult?.inviteLink) {
      navigator.clipboard.writeText(createdResult.inviteLink)
      setCopiedLink(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // --- Footer ---
  const footerContent = createdResult ? (
    <button
      type="button"
      onClick={handleClose}
      className="h-9 w-full rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
    >
      Concluir
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={handleClose}
        disabled={submittingDirect || submittingInvite}
        className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleDirectCreate}
        disabled={submittingDirect || submittingInvite}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        <UserPlus size={14} />
        {submittingDirect ? 'Criando...' : 'Cadastrar'}
      </button>
    </>
  )

  return (
    <Drawer
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm()
        onOpenChange(val)
      }}
      title="Novo membro"
      subtitle="Cadastre diretamente ou gere um link de convite."
      size="lg"
      footer={footerContent}
    >
      {createdResult ? (
        /* --- Estado de Sucesso --- */
        <div className="space-y-4 rounded-xl bg-surface-soft p-5 border border-hairline">
          {createdResult.wifiPassword && (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Membro cadastrado com sucesso!</p>
                <p className="mt-0.5 text-xs text-ink-muted">Senha Wi-Fi inicial:</p>
              </div>
              <div className="rounded-lg bg-surface border border-hairline p-3 font-mono text-lg font-semibold tracking-wider text-primary select-all">
                {createdResult.wifiPassword}
              </div>
            </div>
          )}

          {createdResult.inviteLink && (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Convite enviado!</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Link enviado para <strong>{email}</strong> via Resend.
                </p>
              </div>
              <div className="space-y-1.5 text-left">
                <p className="text-[11px] font-medium text-ink-muted">Link de convite:</p>
                <div className="flex items-center gap-2 rounded-lg bg-surface border border-hairline p-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-muted select-all">{createdResult.inviteLink}</span>
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface-soft border border-hairline px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-hairline transition-colors"
                  >
                    {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copiedLink ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- Formulário --- */
        <div className="space-y-4">
          {/* Email + Gerar Convite */}
          <FormField label="Email" required error={errors.email}>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                }}
                placeholder="exemplo@fabrica.com.br"
                className={`${inputBase} ${errors.email ? inputError : inputIdle} h-9 pr-32`}
              />
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={!canGenerateInvite || submittingInvite}
                title={!canGenerateInvite ? 'Preencha email, nome e perfil de acesso primeiro' : 'Gerar e enviar link de convite'}
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={12} />
                {submittingInvite ? 'Gerando...' : 'Gerar Convite'}
              </button>
            </div>
          </FormField>

          {!inviteOnlyMode && (
            <div className="space-y-4">
              {/* Nome */}
              <FormField label="Nome completo" required error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                  placeholder="Maria Silva"
                  className={`${inputBase} ${errors.name ? inputError : inputIdle} h-9`}
                />
              </FormField>

              {/* CPF + Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="CPF" optional error={errors.cpf}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(e) => {
                      setCpf(maskCpf(e.target.value))
                      if (errors.cpf) setErrors((p) => ({ ...p, cpf: undefined }))
                    }}
                    placeholder="000.000.000-00"
                    className={`${inputBase} ${errors.cpf ? inputError : inputIdle} h-9`}
                  />
                </FormField>

                <FormField label="Telefone" optional error={errors.phone}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className={`${inputBase} ${inputIdle} h-9`}
                  />
                </FormField>
              </div>

              {/* Perfis de Acesso + Wi-Fi */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Perfil de acesso" required error={errors.roleId}>
                  <FormSelect
                    value={selectedRoleId}
                    onChange={setRoleId}
                    placeholder="Selecione"
                    options={roles.data?.data.map((role) => ({
                      value: role.id.toString(),
                      label: role.name === 'admin' ? 'Administrador' : role.name === 'coordenador' ? 'Coordenador' : 'Membro',
                    })) ?? []}
                  />
                </FormField>

                <FormField label="Perfil Wi-Fi" optional>
                  <FormSelect
                    value={wifiProfileId}
                    onChange={setWifiProfileId}
                    placeholder="Padrão (sem limite)"
                    options={wifiProfiles.data?.data.map((p) => ({
                      value: p.id.toString(),
                      label: `${p.name}${p.wifiRateLimit ? ` (${p.wifiRateLimit})` : ''}`,
                    })) ?? []}
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
