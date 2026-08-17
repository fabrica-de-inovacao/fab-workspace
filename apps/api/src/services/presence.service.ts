import { db, radacct, users } from '@fabrica/db'
import { and, count, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm'

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
  return db.select(sessionColumns)
    .from(radacct)
    .leftJoin(users, eq(users.email, radacct.username))
    .where(isNull(radacct.acctstoptime))
    .orderBy(desc(radacct.acctstarttime))
}

export async function listHistory(filters: HistoryFilters) {
  const conditions = []
  if (filters.username) conditions.push(ilike(radacct.username, `%${filters.username}%`))
  if (filters.exactUsername) conditions.push(eq(radacct.username, filters.exactUsername))
  if (filters.from) conditions.push(gte(radacct.acctstarttime, filters.from))
  if (filters.to) conditions.push(lte(radacct.acctstarttime, filters.to))
  const where = conditions.length ? and(...conditions) : undefined

  const [data, total] = await Promise.all([
    db.select(sessionColumns).from(radacct).leftJoin(users, eq(users.email, radacct.username))
      .where(where).orderBy(desc(radacct.acctstarttime)).limit(filters.limit).offset((filters.page - 1) * filters.limit),
    db.select({ total: count() }).from(radacct).where(where),
  ])

  return { data, total: total[0]?.total ?? 0, page: filters.page, limit: filters.limit }
}

export async function getUserHistory(username: string, page: number, limit: number) {
  return listHistory({ page, limit, exactUsername: username })
}
