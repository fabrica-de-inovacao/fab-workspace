# Guia de Implantação no Coolify v4.3.6 (VPS Local + MikroTik)

Este guia descreve o processo simplificado para implantar o **FabITZ Workspace** (API Hono, Painel Admin e Captive Portal) no **Coolify v4.3.6**, utilizando o PostgreSQL existente e a instalação atual do FreeRADIUS na VPS.

---

## 🏗️ Arquitetura do Ambiente

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              VPS LOCAL                                 │
 │                                                                        │
 │  ┌──────────────┐     ┌───────────────┐     ┌───────────────────────┐  │
 │  │ Admin Panel  │     │Captive Portal │     │  Hono API (@fabrica)  │  │
 │  │ (Porta 5173) │     │ (Porta 5174)  │     │      (Porta 3001)     │  │
 │  └──────┬───────┘     └───────┬───────┘     ────────────┬───────────┘  │
 │         │                     │                         │              │
 │         └─────────────────────┼─────────────────────────┘              │
 │                               ▼                                        │
 │                  ┌─────────────────────────┐                           │
 │                  │  PostgreSQL na VPS      │                           │
 │                  │ (db: fab_workspace)     │                           │
 │                  └────────────▲────────────┘                           │
 │                               │                                        │
 │                  ┌────────────┴────────────┐                           │
 │                  │ FreeRADIUS na VPS       │                           │
 │                  │ (UDP 1812 / 1813)       │                           │
 │                  └────────────▲────────────┘                           │
 └───────────────────────────────┼────────────────────────────────────────┘
                                 │ UDP (Auth 1812 / Acct 1813)
                                 ▼
                     ┌───────────────────────┐
                     │ MikroTik RouterBOARD  │
                     │  (Hotspot Concentrator)│
                     └───────────────────────┘
```

---

## 🚀 Método: Implantação via Docker Compose no Coolify

### Passo 1: Criar novo Serviço no Coolify
1. No dashboard do Coolify (`http://<IP_DA_VPS>:8000`), vá no seu projeto e clique em **+ New**.
2. Selecione **Git Source** -> Escolha o repositório do projeto.
3. Em **Build Pack**, escolha **Docker Compose**.
4. O Coolify detectará o arquivo `docker-compose.yml` da raiz do repositório.

---

### Passo 2: Configurar Variáveis de Ambiente no Coolify

Na aba **Environment Variables** do Coolify, adicione:

```env
# URL do PostgreSQL já existente na VPS
DATABASE_URL=postgres://usuario:senha@host:5432/fab_workspace

# Secret do Better Auth (Gerar com: openssl rand -base64 32)
BETTER_AUTH_SECRET=substituir_por_um_secret_forte_com_no_minimo_32_caracteres

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret

# Rede e URLs
NODE_ENV=production
PORT=3001
TRUST_PROXY=true
APP_URL=http://<IP_DA_VPS>:5173
VITE_API_URL=http://<IP_DA_VPS>:3001
```

---

### Passo 3: Executar Migrações do Banco de Dados

Depois que o Coolify realizar o primeiro deploy dos containers:

Execute o comando de sincronização do Drizzle Schema para criar as tabelas no PostgreSQL (incluindo `radcheck`, `radreply`, `radacct`, `vouchers`, etc.):

No terminal da VPS ou aba **Terminal** do container `api` no Coolify:

```bash
docker exec -it <nome_do_container_api> yarn db:push
```

---

## 🔐 Conexão do FreeRADIUS (Já Instalado na VPS)

Como o FreeRADIUS já roda na VPS:

1. Garanta que o FreeRADIUS aponte para o mesmo banco PostgreSQL configurado no `DATABASE_URL`.
2. As tabelas `radcheck`, `radreply` e `radacct` criadas pelo app Hono serão automaticamente lidas/escritas pelo módulo `sql` do FreeRADIUS.

---

## 📡 Configuração no MikroTik RouterOS

1. **Adicionar Servidor RADIUS**:
   - `IP` -> `RADIUS` -> `+ Add New`
   - Service: `hotspot`
   - Address: `<IP_DA_VPS>`
   - Secret: `<SEU_SECRET_RADIUS>`
   - Auth Port: `1812` | Acct Port: `1813`

2. **Ativar RADIUS no Hotspot Profile**:
   - `IP` -> `Hotspot` -> `Server Profiles` -> Seu Perfil
   - Aba `RADIUS`: Marcar `Use RADIUS` e `Accounting: Yes`

3. **Walled Garden (Liberação de Acesso)**:
   - Adicionar o IP da VPS e domínios do Google OAuth em `IP` -> `Hotspot` -> `Walled Garden`.
