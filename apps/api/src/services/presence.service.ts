import { db, radacct, users } from '@fabrica/db'
import { and, count, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm'
import { durationFrom, sessionStatus } from '../lib/duration.js'
import { env } from '../env.js'
import { disconnectRadius, RadiusDisconnectError } from '../lib/radius.js'

export type HistoryFilters = {
  page: number
  limit: number
  username?: string
  exactUsername?: string
  from?: Date
  to?: Date
}

const sessionColumns = {
  id: sql<string>`${radacct.radacctid}::text`,
  username: radacct.username,
  name: users.name,
  image: users.image,
  ip: radacct.framedipaddress,
  mac: radacct.callingstationid,
  startedAt: radacct.acctstarttime,
  updatedAt: radacct.acctupdatetime,
  stoppedAt: radacct.acctstoptime,
  durationSeconds: radacct.acctsessiontime,
  inputBytes: sql<string | null>`${radacct.acctinputoctets}::text`,
  outputBytes: sql<string | null>`${radacct.acctoutputoctets}::text`,
  terminateCause: radacct.acctterminatecause,
}

export async function listOnline() {
  const sessions = await db.select(sessionColumns)
    .from(radacct)
    .leftJoin(users, eq(users.email, radacct.username))
    .where(isNull(radacct.acctstoptime))
    .orderBy(desc(radacct.acctstarttime))

  return sessions.map((session) => ({
    ...session,
    lastSeenAt: session.updatedAt ?? session.startedAt,
    status: sessionStatus(session.startedAt, session.updatedAt, session.stoppedAt),
    durationSeconds: durationFrom(session.startedAt, null),
  }))
}

export async function disconnectSession(id: string) {
  let sessionId: bigint
  try {
    sessionId = BigInt(id)
  } catch {
    throw new Error('SESSION_NOT_FOUND')
  }

  const session = await db.query.radacct.findFirst({ where: eq(radacct.radacctid, sessionId) })
  if (!session) throw new Error('SESSION_NOT_FOUND')
  if (session.acctstoptime) throw new Error('SESSION_NOT_ACTIVE')
  if (!env.RADIUS_COA_SECRET) throw new Error('RADIUS_COA_NOT_CONFIGURED')

  try {
    await disconnectRadius({
      nasIpAddress: session.nasipaddress,
      username: session.username,
      acctSessionId: session.acctsessionid,
      callingStationId: session.callingstationid,
      framedIpAddress: session.framedipaddress,
      secret: env.RADIUS_COA_SECRET,
      port: env.RADIUS_COA_PORT,
    })
  } catch (error) {
    if (error instanceof RadiusDisconnectError) {
      if (error.reason === 'timeout') throw new Error('RADIUS_DISCONNECT_TIMEOUT')
      if (error.reason === 'network') throw new Error('RADIUS_DISCONNECT_NETWORK')
      if (error.reason === 'rejected') throw new Error('RADIUS_DISCONNECT_REJECTED')
    }
    throw error
  }

  return { sessionId: id, status: 'disconnect_requested' as const }
}

export async function listHistory(filters: HistoryFilters) {
  const conditions = []
  if (filters.username) conditions.push(ilike(radacct.username, `%${filters.username}%`))
  if (filters.exactUsername) conditions.push(eq(radacct.username, filters.exactUsername))
  if (filters.from) conditions.push(gte(radacct.acctstarttime, filters.from))
  if (filters.to) conditions.push(lte(radacct.acctstarttime, filters.to))
  const where = conditions.length ? and(...conditions) : undefined

  const [rows, total] = await Promise.all([
    db.select(sessionColumns).from(radacct).leftJoin(users, eq(users.email, radacct.username))
      .where(where).orderBy(desc(radacct.acctstarttime)).limit(filters.limit).offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(radacct).where(where),
  ])

  const data = rows.map((session) => ({
    ...session,
    lastSeenAt: session.updatedAt ?? session.startedAt,
    status: sessionStatus(session.startedAt, session.updatedAt, session.stoppedAt),
    durationSeconds: durationFrom(session.startedAt, session.stoppedAt ? session.durationSeconds : null, session.stoppedAt?.getTime()),
  }))

  return { data, total: total[0]?.total ?? 0, page: filters.page, limit: filters.limit }
}

export async function getUserHistory(username: string, page: number, limit: number) {
  return listHistory({ page, limit, exactUsername: username })
}
