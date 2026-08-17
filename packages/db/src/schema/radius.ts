import {
  pgTable,
  serial,
  varchar,
  integer,
  bigserial,
  bigint,
  timestamp,
  inet,
  index,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// ATENÇÃO: Estas tabelas são controladas pelo FreeRADIUS.
// NÃO alterar nomes de colunas, tipos ou estrutura.
// O app apenas faz INSERT/UPDATE/DELETE em radcheck e radreply.
// radacct é READ-ONLY para o app (FreeRADIUS escreve nela).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// radcheck — credenciais de autenticação Wi-Fi
// ---------------------------------------------------------------------------
export const radcheck = pgTable(
  'radcheck',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 64 }).notNull(),
    attribute: varchar('attribute', { length: 64 }).notNull(),
    op: varchar('op', { length: 2 }).notNull(),
    value: varchar('value', { length: 253 }).notNull(),
  },
  (table) => [index('radcheck_username_idx').on(table.username)],
)

// ---------------------------------------------------------------------------
// radreply — atributos pós-autenticação (rate limits, timeouts)
// ---------------------------------------------------------------------------
export const radreply = pgTable(
  'radreply',
  {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 64 }).notNull(),
    attribute: varchar('attribute', { length: 64 }).notNull(),
    op: varchar('op', { length: 2 }).notNull(),
    value: varchar('value', { length: 253 }).notNull(),
  },
  (table) => [index('radreply_username_idx').on(table.username)],
)

// ---------------------------------------------------------------------------
// radusergroup — associação de usuário a grupo RADIUS
// ---------------------------------------------------------------------------
export const radusergroup = pgTable('radusergroup', {
  username: varchar('username', { length: 64 }).notNull(),
  groupname: varchar('groupname', { length: 64 }).notNull(),
  priority: integer('priority').notNull().default(1),
})

// ---------------------------------------------------------------------------
// radacct — log de contabilidade de sessões Wi-Fi (READ-ONLY pelo app)
// ---------------------------------------------------------------------------
export const radacct = pgTable('radacct', {
  radacctid: bigserial('radacctid', { mode: 'bigint' }).primaryKey(),
  acctsessionid: varchar('acctsessionid', { length: 64 }).notNull(),
  acctuniqueid: varchar('acctuniqueid', { length: 32 }).notNull(),
  username: varchar('username', { length: 64 }).notNull(),
  realm: varchar('realm', { length: 64 }),
  nasipaddress: inet('nasipaddress').notNull(),
  nasportid: varchar('nasportid', { length: 32 }),
  nasporttype: varchar('nasporttype', { length: 32 }),
  acctstarttime: timestamp('acctstarttime'),
  acctupdatetime: timestamp('acctupdatetime'),
  acctstoptime: timestamp('acctstoptime'), // NULL = sessão ativa
  acctsessiontime: integer('acctsessiontime'), // segundos conectado
  acctauthentic: varchar('acctauthentic', { length: 32 }),
  connectinfoStart: varchar('connectinfo_start', { length: 128 }),
  connectinfoStop: varchar('connectinfo_stop', { length: 128 }),
  acctinputoctets: bigint('acctinputoctets', { mode: 'bigint' }), // download em bytes
  acctoutputoctets: bigint('acctoutputoctets', { mode: 'bigint' }), // upload em bytes
  calledstationid: varchar('calledstationid', { length: 50 }), // MAC/SSID do AP
  callingstationid: varchar('callingstationid', { length: 50 }), // MAC do dispositivo
  acctterminatecause: varchar('acctterminatecause', { length: 32 }),
  servicetype: varchar('servicetype', { length: 32 }),
  framedprotocol: varchar('framedprotocol', { length: 32 }),
  framedipaddress: inet('framedipaddress'), // IP entregue ao membro
})
