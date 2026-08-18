import { LegalContent } from '../components/legal-content.js'

export function TermosPage() {
  return (
    <LegalContent title="Termos de Uso" updatedAt="17 de agosto de 2026">
      <p>
        Bem-vindo à rede Wi-Fi e ao sistema da <strong>FabITZ Workspace</strong>. Ao acessar nossa rede sem fio ou utilizar
        nosso painel administrativo, você concorda integralmente com os presentes Termos de Uso, com o
        <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e com o <strong>Código Penal Brasileiro</strong>.
      </p>

      <h3>1. Do Acesso à Rede Wi-Fi</h3>
      <p>
        O acesso à rede sem fio da Fábrica de Inovação é fornecido gratuitamente para fins educacionais, corporativos
        e de visitação. O acesso é pessoal, intransferível e vinculado à identificação do usuário (via e-mail/senha ou código de voucher temporário).
      </p>

      <h3>2. Regras de Utilização</h3>
      <p>Ao utilizar nossos serviços de rede, o usuário compromete-se a:</p>
      <ul>
        <li>Não utilizar a rede para práticas ilícitas, fraudulentas ou antiéticas;</li>
        <li>Não acessar, transmitir ou armazenar conteúdo ilegal, difamatório, pornográfico envolvendo menores de idade, ou que viole direitos autorais e propriedade intelectual;</li>
        <li>Não realizar ataques de negação de serviço (DoS/DDoS), varreduras de portas, sniffing de pacotes ou qualquer tentativa de invasão, interceptação ou comprometimento da segurança de outros usuários ou da própria infraestrutura de rede;</li>
        <li>Não compartilhar suas credenciais de acesso ou códigos de voucher com terceiros não autorizados.</li>
      </ul>

      <h3>3. Isenção de Responsabilidade</h3>
      <p>
        A Fábrica de Inovação não se responsabiliza por:
      </p>
      <ul>
        <li>Danos, perdas ou prejuízos decorrentes de falhas no dispositivo do usuário, vírus, malwares ou vulnerabilidades inerentes à internet;</li>
        <li>Instabilidades, lentidão ou indisponibilidade temporária da rede devido a manutenções programadas ou falhas do provedor de internet;</li>
        <li>Conteúdos acessados pelo usuário em sites de terceiros.</li>
      </ul>

      <h3>4. Fiscalização e Penalidades</h3>
      <p>
        Reservamo-nos o direito de monitorar o tráfego de rede para fins de segurança e cumprimento legal.
        O descumprimento destes Termos de Uso acarretará no <strong>bloqueio imediato e definitivo do acesso</strong>
        ao Wi-Fi e ao painel administrativo, sem prejuízo de comunicação às autoridades competentes e adoção das medidas judiciais cabíveis.
      </p>

      <h3>5. Disposições Gerais</h3>
      <p>
        A Fábrica de Inovação poderá alterar estes Termos de Uso a qualquer momento, visando a melhoria contínua ou adequação legal.
        O uso contínuo da rede após eventuais alterações implica na aceitação tácita dos novos termos.
        Para dúvidas sobre estes termos, entre em contato pelo e-mail{' '}
        <a href="mailto:suporte@fabitz.com.br" className="text-primary hover:underline font-medium">
          suporte@fabitz.com.br
        </a>.
      </p>
    </LegalContent>
  )
}
