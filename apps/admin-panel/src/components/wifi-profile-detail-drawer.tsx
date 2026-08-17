import { useState, useEffect } from 'react'
import { Pencil, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteWifiProfile, useUpdateWifiProfile } from '../hooks/use-members.js'
import type { WifiProfile } from '../lib/api.js'
import { Drawer } from './drawer.js'
import { FormSelect } from './form-select.js'
import {
  SPEED_PRESETS, TIMEOUT_PRESETS,
  parseSpeedPreset, parseTimeoutPreset,
  buildSpeedValue, buildTimeoutValue,
  formatTimeoutLong,
} from '../lib/wifi-presets.js'

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-0.5 text-sm text-ink ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

export type WifiProfileDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: WifiProfile | null
  defaultEdit?: boolean
  onRefresh?: () => void
}

export function WifiProfileDetailDrawer({ open, onOpenChange, profile, defaultEdit = false, onRefresh }: WifiProfileDetailDrawerProps) {
  const updateProfile = useUpdateWifiProfile(profile?.id ?? 0)
  const deleteProfile = useDeleteWifiProfile()

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [speedPreset, setSpeedPreset] = useState('')
  const [customDown, setCustomDown] = useState('')
  const [customUp, setCustomUp] = useState('')
  const [timeoutPreset, setTimeoutPreset] = useState('')
  const [customDays, setCustomDays] = useState('')
  const [customHours, setCustomHours] = useState('')
  const [customMinutes, setCustomMinutes] = useState('')

  useEffect(() => {
    if (open && profile) {
      if (defaultEdit) enterEdit()
      else setEditing(false)
      setConfirmDelete(false)
    }
  }, [open, profile?.id, defaultEdit])

  function enterEdit() {
    if (!profile) return
    setName(profile.name)
    setDescription(profile.description ?? '')
    const sp = parseSpeedPreset(profile.wifiRateLimit)
    setSpeedPreset(sp.preset)
    setCustomDown(sp.customDown)
    setCustomUp(sp.customUp)
    const tp = parseTimeoutPreset(profile.wifiSessionTimeout)
    setTimeoutPreset(tp.preset)
    setCustomDays(tp.customDays)
    setCustomHours(tp.customHours)
    setCustomMinutes(tp.customMinutes)
    setEditing(true)
  }

  async function handleSave() {
    if (!profile) return
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        wifiRateLimit: buildSpeedValue(speedPreset, customDown, customUp),
        wifiSessionTimeout: buildTimeoutValue(timeoutPreset, customDays, customHours, customMinutes),
      })
      setEditing(false)
      toast.success('Perfil atualizado com sucesso')
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar')
    }
  }

  async function handleDelete() {
    if (!profile) return
    try {
      await deleteProfile.mutateAsync(profile.id)
      toast.success('Perfil excluído com sucesso')
      setConfirmDelete(false)
      onOpenChange(false)
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir')
    }
  }

  if (!profile) return null

  const inputBase = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50'
  const inputIdle = 'border-hairline-input focus:border-primary'

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(v) => { if (!v) { setEditing(false); setConfirmDelete(false) } onOpenChange(v) }}
        title={editing ? 'Editar perfil' : profile.name}
        subtitle={editing ? 'Atualize as regras de rede' : profile.description || undefined}
        size="lg"
        footer={
          editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={updateProfile.isPending} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
                <Check size={14} />
                {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => onOpenChange(false)} className="h-9 w-full rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
              Fechar
            </button>
          )
        }
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-lg font-bold text-primary">{profile.name[0]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-normal text-ink">{profile.name}</p>
                <p className="text-sm text-ink-muted">{profile.description || 'Sem descrição'}</p>
              </div>
            </div>
            {!editing && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-lg p-2 text-ink-muted/40 transition-colors hover:bg-error-soft hover:text-error" aria-label="Excluir">
                  <Trash2 size={16} />
                </button>
                <button type="button" onClick={enterEdit} className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-soft hover:text-primary" aria-label="Editar">
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Visualização */}
          {!editing && (
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Velocidade" value={profile.wifiRateLimit || 'Sem limite (Ilimitado)'} mono />
              <InfoItem label="Sessão máxima" value={formatTimeoutLong(profile.wifiSessionTimeout)} />
              <InfoItem label="Descrição" value={profile.description || 'Sem descrição'} />
              <InfoItem label="ID" value={String(profile.id)} />
            </div>
          )}

          {/* Edição */}
          {editing && (
            <div className="space-y-4">
              <FormField label="Nome do perfil" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Padrão 20M" className={`${inputBase} ${inputIdle} h-9`} />
              </FormField>

              <FormField label="Descrição" optional>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do plano" className={`${inputBase} ${inputIdle} h-9`} />
              </FormField>

              {/* Velocidade */}
              <FormField label="Limite de velocidade" optional>
                <FormSelect
                  value={speedPreset}
                  onChange={setSpeedPreset}
                  placeholder="Selecione"
                  options={SPEED_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
                />
              </FormField>
              {speedPreset === '__custom__' && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Download" optional>
                    <div className="relative">
                      <input type="text" value={customDown} onChange={(e) => setCustomDown(e.target.value)} placeholder="Ex: 20" className={`${inputBase} ${inputIdle} h-9 pr-7`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted/50">Mbps</span>
                    </div>
                  </FormField>
                  <FormField label="Upload" optional>
                    <div className="relative">
                      <input type="text" value={customUp} onChange={(e) => setCustomUp(e.target.value)} placeholder="Ex: 10" className={`${inputBase} ${inputIdle} h-9 pr-7`} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted/50">Mbps</span>
                    </div>
                  </FormField>
                </div>
              )}

              {/* Timeout */}
              <FormField label="Duração máxima da sessão" optional>
                <FormSelect
                  value={timeoutPreset}
                  onChange={setTimeoutPreset}
                  placeholder="Selecione"
                  options={TIMEOUT_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
                />
              </FormField>
              {timeoutPreset === '__custom__' && (
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Dias" optional>
                    <input type="number" min="0" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="0" className={`${inputBase} ${inputIdle} h-9`} />
                  </FormField>
                  <FormField label="Horas" optional>
                    <input type="number" min="0" max="23" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="0" className={`${inputBase} ${inputIdle} h-9`} />
                  </FormField>
                  <FormField label="Minutos" optional>
                    <input type="number" min="0" max="59" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="0" className={`${inputBase} ${inputIdle} h-9`} />
                  </FormField>
                </div>
              )}
            </div>
          )}
        </div>
      </Drawer>

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setConfirmDelete(false)} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-light tracking-tight text-ink">Excluir perfil?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              O perfil <strong>{profile.name}</strong> será excluído. Membros que utilizam este perfil perderão acesso Wi-Fi.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted">Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={deleteProfile.isPending} className="rounded-full bg-error px-4 py-2 text-sm text-white hover:bg-error/90 disabled:opacity-60">
                {deleteProfile.isPending ? 'Excluindo...' : 'Excluir'}
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
