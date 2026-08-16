import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import type {
  users,
  roles,
  userRoles,
  radcheck,
  radreply,
  radusergroup,
  radacct,
} from '@fabrica/db'

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Role = InferSelectModel<typeof roles>
export type NewRole = InferInsertModel<typeof roles>

export type UserRole = InferSelectModel<typeof userRoles>
export type NewUserRole = InferInsertModel<typeof userRoles>

// ---------------------------------------------------------------------------
// RADIUS types (read-only for app consumers)
// ---------------------------------------------------------------------------
export type Radcheck = InferSelectModel<typeof radcheck>
export type Radreply = InferSelectModel<typeof radreply>
export type Radusergroup = InferSelectModel<typeof radusergroup>
export type Radacct = InferSelectModel<typeof radacct>

// ---------------------------------------------------------------------------
// Composed / view types (usados nas respostas da API)
// ---------------------------------------------------------------------------
export type MemberWithRoles = User & {
  roles: Role[]
}

export type MemberStatus = 'active' | 'inactive'

export type PresenceSession = Pick<
  Radacct,
  | 'username'
  | 'acctstarttime'
  | 'acctstoptime'
  | 'acctsessiontime'
  | 'framedipaddress'
  | 'callingstationid'
  | 'calledstationid'
>
