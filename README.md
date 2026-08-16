# FAB Workspace

Monorepo do painel administrativo, API e captive portal da Fábrica. Membros são mantidos no PostgreSQL e provisionados nas tabelas SQL do FreeRADIUS.

## Requisitos

- Node.js 20+
- Yarn 1.22
- PostgreSQL com as tabelas do FreeRADIUS
- Credenciais OAuth do Google

## Setup local

```bash
cp .env.example .env
yarn install
yarn db:push
yarn dev
```

Serviços locais:

- Admin: `http://localhost:5173`
- Captive portal: `http://localhost:5174`
- API: `http://localhost:3001`
- OpenAPI: `http://localhost:3001/openapi.json`

Crie o primeiro administrador uma única vez:

```bash
curl -X POST http://localhost:3001/api/bootstrap/admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"change-me"}'
```

## Verificação

```bash
yarn workspace @fabrica/api test
yarn typecheck
yarn build
```

Testes de integração de membros são ignorados por padrão. Use um banco descartável com schema aplicado:

```bash
TEST_DATABASE_URL=postgres://... yarn workspace @fabrica/api test
```

## Deploy

1. Configure as variáveis de `.env.example` no ambiente de produção.
2. Use `NODE_ENV=production` e segredo Better Auth com no mínimo 32 caracteres.
3. Use `TRUST_PROXY=true` somente atrás de proxy confiável que sobrescreva `CF-Connecting-IP` ou `X-Forwarded-For`.
4. Execute `yarn db:push` ou migrações revisadas antes da API.
5. Execute `yarn build` e sirva os diretórios `dist` dos frontends.
6. Inicie a API com `yarn workspace @fabrica/api start`.

O captive portal envia credenciais diretamente ao `link-login` do MikroTik; não existe endpoint público próprio para limitar na API.
