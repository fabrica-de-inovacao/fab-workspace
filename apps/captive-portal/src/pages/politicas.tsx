import { LegalContent } from '../components/legal-content.js'

export function PoliticasPage() {
  return (
    <LegalContent title="Política de Privacidade" updatedAt="17 de agosto de 2026">
      <p>
        A <strong>FabITZ Workspace</strong> valoriza a privacidade e proteção dos dados pessoais de seus membros,
        colaboradores e visitantes. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e
        protegemos suas informações, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>
        e o <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
      </p>

      <h3>1. Dados Coletados</h3>
      <p>
        Para viabilizar o acesso à rede Wi-Fi e às ferramentas do painel administrativo, coletamos os seguintes dados pessoais:
      </p>
      <ul>
        <li><strong>Dados Cadastrais:</strong> Nome completo, e-mail, CPF e número de telefone.</li>
        <li><strong>Dados de Autenticação:</strong> Senhas de acesso (armazenadas com hash seguro no sistema interno).</li>
        <li><strong>Dados de Navegação e Conexão (Wi-Fi):</strong> Endereço IP, endereço MAC do dispositivo, horários de início e fim da conexão e dados de tráfego de rede, conforme exigência legal de retenção de registros de conexão.</li>
      </ul>

      <h3>2. Finalidade do Tratamento</h3>
      <p>Os dados pessoais coletados são utilizados exclusivamente para:</p>
      <ul>
        <li>Autenticação e provisionamento de acesso seguro à rede Wi-Fi corporativa;</li>
        <li>Gestão de membros e permissões no painel administrativo;</li>
        <li>Monitoramento de segurança da rede e detecção de ameaças ou comportamentos ilícitos;</li>
        <li>Cumprimento de obrigações legais e regulatórias (ex: retenção de logs de acesso à internet por 1 ano, conforme art. 15 do Marco Civil da Internet).</li>
      </ul>

      <h3>3. Compartilhamento de Dados</h3>
      <p>
        Os dados pessoais <strong>não são vendidos ou compartilhados</strong> com terceiros para fins comerciais ou de marketing.
        O compartilhamento poderá ocorrer exclusivamente para:
      </p>
      <ul>
        <li>Atendimento a ordens judiciais ou requisições de autoridades policiais/administrativas competentes;</li>
        <li>Provedores de infraestrutura essenciais para o funcionamento do sistema (ex: Google Cloud para autenticação OAuth, Resend para envio de e-mails transacionais), sempre sob rígidos contratos de proteção de dados.</li>
      </ul>

      <h3>4. Direitos do Titular (LGPD)</h3>
      <p>
        Você possui direito de acessar, corrigir, solicitar a anonimização ou exclusão de seus dados pessoais de nossa base.
        Para exercer seus direitos, envie uma solicitação formal pelo e-mail{' '}
        <a href="mailto:suporte@fabitz.com.br" className="text-primary hover:underline font-medium">
          suporte@fabitz.com.br
        </a>.
      </p>

      <h3>5. Segurança e Retenção</h3>
      <p>
        Adotamos criptografia de ponta a ponta, políticas de acesso restrito e servidores isolados para proteger suas informações.
        Os dados de navegação são retidos apenas pelo período exigido por lei (12 meses), sendo eliminados de forma segura em seguida.
      </p>
    </LegalContent>
  )
}
