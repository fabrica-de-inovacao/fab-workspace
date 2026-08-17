import { Resend } from 'resend'
import { env } from '../env.js'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export type SendInvitationEmailInput = {
  to: string
  name: string
  inviteLink: string
}

export async function sendInvitationEmail({ to, name, inviteLink }: SendInvitationEmailInput) {
  const subject = 'Convite para o FabITZ Workspace — Fábrica de Inovação'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 300; color: #0066A1; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
          .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 28px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #0066A1; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 9999px; }
          .footer { font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; pt: 20px; margin-top: 28px; }
          .link-box { word-break: break-all; font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 10px; border-radius: 8px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">FabITZ Workspace</h1>
            <div class="subtitle">Fábrica de Inovação</div>
          </div>
          <div class="content">
            <p>Olá, <strong>${name}</strong>!</p>
            <p>Você foi convidado(a) para se juntar ao <strong>FabITZ Workspace</strong>. Clique no botão abaixo para concluir o seu cadastro e definir sua senha de acesso ao painel e à rede Wi-Fi da Fábrica:</p>
            <div class="btn-container">
              <a href="${inviteLink}" class="btn" target="_blank">Completar meu Cadastro</a>
            </div>
            <p>Se o botão acima não funcionar, copie e cole o link no seu navegador:</p>
            <div class="link-box">${inviteLink}</div>
          </div>
          <div class="footer">
            <p>Fábrica de Inovação — Este convite expira em 48 horas.</p>
          </div>
        </div>
      </body>
    </html>
  `

  if (resend) {
    await resend.emails.send({
      from: 'FabITZ Workspace <workspace@fabitz.com.br>',
      to: [to],
      subject,
      html,
    })
  } else {
    console.log('\n✉️ [RESEND DEV FALLBACK - EMAIL CONVITE]')
    console.log(`Para: ${to}`)
    console.log(`Assunto: ${subject}`)
    console.log(`Link de Convite: ${inviteLink}\n`)
  }
}
