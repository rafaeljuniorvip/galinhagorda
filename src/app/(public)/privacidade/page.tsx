import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-8">Última atualização: 12 de março de 2026</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introdução</h2>
          <p>
            O aplicativo <strong>Galinha Gorda Admin</strong> é uma ferramenta de gestão administrativa
            de campeonatos de futebol amador em Itapecerica-MG. Esta política descreve como coletamos,
            usamos e protegemos suas informações.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Dados coletados</h2>
          <p>Coletamos apenas os dados necessários para o funcionamento do aplicativo:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Dados de autenticação:</strong> nome, e-mail e foto do perfil obtidos através do login com Google.</li>
            <li><strong>Dados de uso:</strong> informações inseridas pelo administrador no gerenciamento de campeonatos, como dados de jogadores, times, partidas e resultados.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Uso dos dados</h2>
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Autenticação e controle de acesso ao painel administrativo.</li>
            <li>Gestão de campeonatos, jogadores, times e partidas.</li>
            <li>Exibição de informações públicas sobre os campeonatos no site galinhagorda.vip.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartilhamento de dados</h2>
          <p>
            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros.
            Os dados de campeonatos (classificações, resultados, estatísticas) são exibidos
            publicamente no site como parte da funcionalidade do sistema.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em servidores seguros com acesso restrito.
            Utilizamos criptografia (HTTPS/TLS) em todas as comunicações e
            tokens JWT para autenticação segura.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Serviços de terceiros</h2>
          <p>Utilizamos os seguintes serviços de terceiros:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Google OAuth:</strong> para autenticação segura via conta Google.</li>
            <li><strong>Expo/EAS:</strong> para distribuição e atualização do aplicativo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Seus direitos</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Solicitar acesso aos seus dados pessoais.</li>
            <li>Solicitar a correção ou exclusão dos seus dados.</li>
            <li>Revogar o acesso do aplicativo à sua conta Google a qualquer momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Público-alvo</h2>
          <p>
            Este aplicativo é destinado a administradores maiores de 18 anos.
            Não coletamos intencionalmente dados de menores de 13 anos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contato</h2>
          <p>
            Para dúvidas sobre esta política ou sobre seus dados, entre em contato pelo e-mail:{' '}
            <a href="mailto:viptecnologia@gmail.com" className="text-blue-600 hover:underline">
              viptecnologia@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Alterações</h2>
          <p>
            Esta política pode ser atualizada periodicamente. Recomendamos revisar esta página
            regularmente para estar ciente de quaisquer mudanças.
          </p>
        </section>
      </div>
    </div>
  );
}
