import { useState } from 'react'
import { Link, useRouteContext } from '@tanstack/react-router'
import {
  Activity,
  ArrowRight,
  Clock,
  Cpu,
  Database,
  Layers,
  type LucideIcon,
  Plus,
  Radio,
  RefreshCw,
  ShieldAlert,
  Ticket,
  Users,
  Wifi,
  Zap,
} from 'lucide-react'
import { authClient } from '../lib/auth-client.js'
import { useOnlinePresence } from '../hooks/use-presence.js'
import { useMembers, useWifiProfiles } from '../hooks/use-members.js'
import { useVouchers } from '../hooks/use-vouchers.js'
import { PageBody, PageHeader, PageShell } from '../components/page.js'
import { SkeletonRow } from '../components/feedback.js'

const { useSession } = authClient

function formatBytes(value: number) {
  if (value <= 0) return '0 B'
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

type ModuleStatus = 'active' | 'upcoming' | 'planned'

interface LabModule {
  id: string
  title: string
  description: string
  icon: LucideIcon
  status: ModuleStatus
  tag: string
  eta?: string
  link?: string
}

const UPCOMING_MODULES: LabModule[] = [
  {
    id: 'wifi',
    title: 'Gestão de Rede & Presença',
    description: 'Controle RADIUS, sessões MikroTik, vouchers e perfis de velocidade.',
    icon: Wifi,
    status: 'active',
    tag: 'Operacional',
    link: '/presence',
  },
  {
    id: 'access-control',
    title: 'Catracas & Acesso Físico',
    description: 'Integração com fechaduras e biometria/QR para entrada no laboratório.',
    icon: ShieldAlert,
    status: 'upcoming',
    tag: 'Em desenvolvimento',
    eta: 'Q3 2026',
  },
  {
    id: 'inventory',
    title: 'Inventário & Ferramental',
    description: 'Check-out de componentes, impressoras 3D, bancadas e osciloscópios.',
    icon: Layers,
    status: 'upcoming',
    tag: 'Em breve',
    eta: 'Q4 2026',
  },
  {
    id: 'events',
    title: 'Agendamento & Eventos',
    description: 'Reserva de salas de reunião, espaço de pitching e palestras.',
    icon: Clock,
    status: 'planned',
    tag: 'Planejado',
    eta: '2027',
  },
]

export function DashboardPage() {
  const { data: session } = useSession()
  const { roles } = useRouteContext({ from: '/authenticated' })
  const isAdmin = roles.includes('admin')
  const isCoordinator = isAdmin || roles.includes('coordenador')

  const online = useOnlinePresence()
  const members = useMembers({ limit: 100 })
  const vouchers = useVouchers()
  const wifiProfiles = useWifiProfiles()

  const [activeTab, setActiveTab] = useState<'overview' | 'modules'>('overview')

  const onlineSessions = online.data?.data.filter((s) => s.status === 'online') ?? []
  const staleSessions = online.data?.data.filter((s) => s.status === 'stale') ?? []
  const activeCount = onlineSessions.length
  const totalMembers = members.data?.total ?? 0

  const activeVouchers = vouchers.data?.data.filter((v) => !v.usedAt && new Date(v.expiresAt) > new Date()).length ?? 0

  const totalInputBytes = onlineSessions.reduce((acc, s) => acc + Number(s.inputBytes ?? 0), 0)
  const totalOutputBytes = onlineSessions.reduce((acc, s) => acc + Number(s.outputBytes ?? 0), 0)
  const totalTraffic = totalInputBytes + totalOutputBytes

  const isInitialLoading = online.isPending || members.isPending

  return (
    <PageShell>
      <PageHeader
        eyebrow="Fábrica de Inovação · Workspace"
        title={`Olá, ${session?.user?.name?.split(' ')[0] ?? 'usuário'}`}
        subtitle="Visão geral do ecossistema e operações do laboratório."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void online.refetch()
                void members.refetch()
                void vouchers.refetch()
              }}
              aria-label="Atualizar dados do dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline-input text-ink-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              title="Atualizar dados"
            >
              <RefreshCw size={15} className={online.isFetching ? 'animate-spin text-primary' : ''} />
            </button>

            {isCoordinator && (
              <Link
                to="/members"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus size={15} />
                <span>Novo membro</span>
              </Link>
            )}
          </div>
        }
      />

      <PageBody>
        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-hairline">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Operação da Rede
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'modules'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Módulos do Workspace
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Realtime Status Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-6 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-soft text-secondary-700">
                    <Radio size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium tracking-tight text-ink">Presença Wi-Fi em Tempo Real</h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2.5 py-0.5 text-xs font-medium text-secondary-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-secondary-700" />
                        Live RADIUS
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      Monitoramento contínuo das conexões ativas no laboratório.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-hairline pt-4 sm:border-t-0 sm:pt-0">
                  <div className="min-w-28">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70">Conectados agora</p>
                    <p className="tabular-nums text-2xl font-light text-ink">{activeCount}</p>
                  </div>
                  <div className="h-8 w-px bg-hairline hidden sm:block" />
                  <div className="min-w-28">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted/70">Tráfego Instantâneo</p>
                    <p className="tabular text-lg font-medium text-primary">{formatBytes(totalTraffic)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Connected Users List / Live Feed */}
              <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs lg:col-span-2">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div>
                    <h3 className="text-base font-medium text-ink">Membros & Visitantes Online</h3>
                    <p className="text-xs text-ink-muted">Sessões autenticadas via WPA2-Enterprise / Portal</p>
                  </div>
                  <Link
                    to="/presence"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <span>Ver detalhado</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {isInitialLoading ? (
                    <div className="space-y-3 py-2">
                      {[1, 2, 3].map((r) => (
                        <SkeletonRow key={r} />
                      ))}
                    </div>
                  ) : onlineSessions.length === 0 ? (
                    <div className="py-8 text-center">
                      <Activity size={24} className="mx-auto text-ink-muted/40" />
                      <p className="mt-2 text-sm text-ink font-medium">Nenhum dispositivo ativo no momento</p>
                      <p className="text-xs text-ink-muted">As conexões aparecerão conforme os membros entrarem na rede.</p>
                    </div>
                  ) : (
                    onlineSessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-xl border border-hairline/60 bg-surface-soft p-3 transition-colors hover:border-hairline"
                      >
                        <div className="flex items-center gap-3">
                          {session.image ? (
                            <img src={session.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {(session.name ?? session.username)[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-ink">{session.name ?? session.username}</p>
                            <p className="text-xs font-mono text-ink-muted">{session.ip ?? 'IP dinâmico'} · {session.mac ?? 'MAC não registrado'}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary-700 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-secondary-700 animate-ping" />
                            Ativo
                          </span>
                          <p className="tabular text-[11px] text-ink-muted/70">
                            {formatBytes(Number(session.inputBytes ?? 0) + Number(session.outputBytes ?? 0))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {onlineSessions.length > 5 && (
                    <div className="pt-2 text-center">
                      <Link to="/presence" className="text-xs text-ink-muted hover:text-primary">
                        + {onlineSessions.length - 5} outras sessões ativas
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Network Capacity & Quick Status */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs">
                  <h3 className="text-base font-medium text-ink">Recursos & Capacidade</h3>
                  <p className="text-xs text-ink-muted">Visão de cadastro e limites de rede</p>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-surface-soft p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-ink-muted">Membros Cadastrados</p>
                          <p className="text-lg font-normal text-ink">{totalMembers}</p>
                        </div>
                      </div>
                      <Link to="/members" className="text-xs text-primary font-medium hover:underline">Ver</Link>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-surface-soft p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <Ticket size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-ink-muted">Vouchers Válidos</p>
                          <p className="text-lg font-normal text-ink">{activeVouchers}</p>
                        </div>
                      </div>
                      <Link to="/vouchers" className="text-xs text-primary font-medium hover:underline">Gerar</Link>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-surface-soft p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-soft text-secondary-700">
                          <Cpu size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-ink-muted">Perfis Wi-Fi Ativos</p>
                          <p className="text-lg font-normal text-ink">{wifiProfiles.data?.data.length ?? 0}</p>
                        </div>
                      </div>
                      <Link to="/wifi-profiles" className="text-xs text-primary font-medium hover:underline">Ajustar</Link>
                    </div>
                  </div>
                </div>

                {/* Direct Action Hub */}
                <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-xs">
                  <h3 className="text-sm font-medium text-ink">Ações Rápida</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      to="/members"
                      className="flex flex-col items-start gap-1 rounded-xl border border-hairline p-3 transition-colors hover:bg-surface-soft"
                    >
                      <Users size={16} className="text-primary" />
                      <span className="text-xs font-medium text-ink">Membros</span>
                    </Link>
                    <Link
                      to="/vouchers"
                      className="flex flex-col items-start gap-1 rounded-xl border border-hairline p-3 transition-colors hover:bg-surface-soft"
                    >
                      <Ticket size={16} className="text-primary" />
                      <span className="text-xs font-medium text-ink">Criar Voucher</span>
                    </Link>
                    <Link
                      to="/presence"
                      className="flex flex-col items-start gap-1 rounded-xl border border-hairline p-3 transition-colors hover:bg-surface-soft"
                    >
                      <Wifi size={16} className="text-primary" />
                      <span className="text-xs font-medium text-ink">Sessões Live</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex flex-col items-start gap-1 rounded-xl border border-hairline p-3 transition-colors hover:bg-surface-soft"
                    >
                      <Database size={16} className="text-primary" />
                      <span className="text-xs font-medium text-ink">Meu Perfil</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Roadmap of Workspace Modules */
          <div className="space-y-6">
            <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-ink">Ecossistema Fábrica de Inovação</h2>
                  <p className="text-xs text-ink-muted">
                    O módulo de Rede Wi-Fi/RADIUS é a primeira camada operacional ativa do Workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {UPCOMING_MODULES.map((module) => {
                const Icon = module.icon
                return (
                  <div
                    key={module.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                      module.status === 'active'
                        ? 'border-primary/40 bg-surface shadow-xs'
                        : 'border-hairline bg-surface-soft opacity-85'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            module.status === 'active'
                              ? 'bg-primary text-white'
                              : 'bg-surface text-ink-muted border border-hairline'
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            module.status === 'active'
                              ? 'bg-secondary-soft text-secondary-700'
                              : 'bg-hairline text-ink-muted'
                          }`}
                        >
                          {module.tag}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-medium text-ink">{module.title}</h3>
                      <p className="mt-1 text-xs text-ink-muted leading-relaxed">{module.description}</p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-hairline pt-3">
                      {module.status === 'active' ? (
                        <Link
                          to={module.link!}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <span>Acessar módulo</span>
                          <ArrowRight size={14} />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <Clock size={13} />
                          <span>Previsão: {module.eta}</span>
                        </div>
                      )}

                      {module.status !== 'active' && (
                        <span className="text-[11px] font-mono text-ink-muted/50 uppercase">Em breve</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </PageBody>
    </PageShell>
  )
}
