import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCreateMember, useRoles } from '../hooks/use-members.js'

export function NewMemberPage() {
  const router = useRouter()
  const roles = useRoles()
  const createMember = useCreateMember()
  const [wifiPassword, setWifiPassword] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const result = await createMember.mutateAsync({
        name: String(form.get('name')),
        email: String(form.get('email')),
        cpf: String(form.get('cpf')).replace(/\D/g, '') || null,
        phone: String(form.get('phone')) || null,
        roleId: Number(form.get('roleId')),
      })
      setWifiPassword(result.data.wifiPassword)
      toast.success('Membro criado e Wi-Fi provisionado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar membro')
    }
  }

  return (
    <main className="min-h-full p-4 sm:p-6">
      <section className="mx-auto max-w-3xl rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
        <Link to="/members" className="text-sm text-primary">Voltar para membros</Link>
        <h1 className="mt-5 text-2xl font-light tracking-tight text-ink">Novo membro</h1>
        <p className="mt-1 text-sm text-ink-muted">Ao salvar, o acesso Wi-Fi será provisionado automaticamente.</p>

        {wifiPassword ? (
          <div className="mt-8 rounded-xl bg-secondary-soft p-5">
            <p className="text-sm text-secondary-700">Membro criado. Senha inicial do Wi-Fi:</p>
            <p className="mt-2 font-mono text-lg text-ink">{wifiPassword}</p>
            <button onClick={() => router.navigate({ to: '/members' })} className="mt-5 rounded-full bg-primary px-4 py-2 text-sm text-white">Concluir</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field label="Nome" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="CPF" name="cpf" placeholder="Somente números" />
            <Field label="Telefone" name="phone" />
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-normal text-ink">Perfil de acesso</span>
              <select name="roleId" required className="w-full rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="">Selecione</option>
                {roles.data?.data.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </label>
            {roles.data?.data.length === 0 && <p className="sm:col-span-2 text-sm text-warning-700">Crie um perfil via API antes de cadastrar membros.</p>}
            <div className="sm:col-span-2 flex justify-end gap-3 pt-3">
              <Link to="/members" className="rounded-full border border-hairline-input px-4 py-2.5 text-sm text-ink-muted">Cancelar</Link>
              <button disabled={createMember.isPending} className="rounded-full bg-primary px-4 py-2.5 text-sm text-white disabled:opacity-60">
                {createMember.isPending ? 'Criando...' : 'Criar membro'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

function Field(props: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label><span className="mb-1.5 block text-xs font-normal text-ink">{props.label}</span><input {...props} className="w-full rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
}
