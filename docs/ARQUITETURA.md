# Documento de Arquitetura de Sistema Web – Desa Pego (Brechó Comunitário)

Oct 30, 2026 · @Maria Clara

**Projeto:** Desa Pego – Brechó Online Comunitário

**Versão:** 2.0 (alinhada ao MVP de 15 requisitos)

**Responsável:** Equipe de Arquitetura

**Estudantes:** Clarice Nunes, Livia Morais, Helena Furtado, Marina Almeida, Maria Clara Pedrosa

**Status:** Em revisão

## 1. Visão Geral

### 1.1 Objetivo do Documento

Este documento descreve a arquitetura técnica do sistema web Desa Pego, um brechó online comunitário. Ele define componentes, integrações, padrões e decisões de design que sustentam os 15 requisitos do MVP e a evolução posterior.

### 1.2 Escopo

**Dentro do escopo (MVP):** os 5 módulos do documento de requisitos, cada um com 2 requisitos funcionais e 1 de testes:

1.  Contas e Perfil do Vendedor (cadastro, login, chave Pix)

2.  Anúncios e Simulador de Ganho

3.  Catálogo e Detalhes da Peça

4.  Carrinho, Checkout e Pix

5.  Pedidos, Carteira e Administração

**Fora do MVP (previsto na arquitetura, sem implementação agora):** cartão e boleto; repasse e saque automáticos; frete calculado com rastreio; moderação prévia, avaliações, disputas e denúncias; favoritos, alertas, e-mails e recuperação de senha; chat, FAQ e relatórios do admin; inovações de economia circular (contador de impacto, passaporte da peça, pontos e selos, doação, pontos de coleta, sugestão por foto com IA).

**Premissas assumidas:**

- Marketplace comunitário: qualquer pessoa cadastrada pode vender e comprar. A plataforma intermedeia o pagamento e retém uma comissão.

- Pagamento somente via Pix no MVP; frete fixo configurável pelo admin.

- Repasse ao vendedor feito manualmente pelo admin, via Pix, após a confirmação de recebimento.

- Equipe de 5 estudantes, um módulo por pessoa, orçamento enxuto.

- Catálogo de poucos milhares de peças, quase todas únicas (estoque de 1 unidade).

### 1.3 Público-Alvo

Desenvolvedores, arquitetos de software, DevOps, professores avaliadores e demais envolvidos no ciclo de vida do sistema.

## 2. Descrição do Sistema

### 2.1 Contexto e Propósito

Muita gente tem roupas e calçados parados em casa, mas vender sozinho é trabalhoso e arriscado: é preciso negociar, cobrar e confiar no comprador. O Desa Pego permite que qualquer pessoa anuncie suas peças, veja antes quanto vai receber e venda com pagamento garantido via Pix.

**Usuários principais:**

- **Vendedor:** anuncia peças e recebe o valor líquido da venda.

- **Comprador:** encontra, reserva e paga as peças.

- **Admin:** configura comissão e frete, faz o repasse aos vendedores e oculta anúncios indevidos (ex.: Lúcia).

Uma mesma conta pode atuar como comprador e vendedor; o perfil de vendedor é ativado ao cadastrar a chave Pix.

**Características que definem a arquitetura:**

- Quase toda peça é única: duas pessoas não podem comprar a mesma peça. Reserva e controle de estoque são o ponto mais crítico.

- A plataforma recebe o dinheiro e repassa depois: a divisão entre vendedor, comissão e taxa precisa ser exata e auditável.

- O sistema guarda CPF e chave Pix, dados pessoais protegidos pela LGPD.

### 2.2 Principais Funcionalidades

| Módulo                | Requisito | Funcionalidade                                                                | Componente da arquitetura                 |
|-----------------------|-----------|-------------------------------------------------------------------------------|-------------------------------------------|
| 01 Contas e Perfil    | 001       | Cadastro com nome, e-mail, CPF e senha; login e logout                        | Módulo contas (NestJS), PostgreSQL, JWT   |
| 01 Contas e Perfil    | 002       | Perfil do vendedor com nome público, cidade e chave Pix validada e mascarada  | Módulo contas, criptografia de campo      |
| 01 Contas e Perfil    | 003       | Testes de cadastro, login e chave Pix                                         | Jest + Supertest, CI da branch            |
| 02 Anúncios           | 004       | Criar, editar, pausar e excluir anúncio com 1 a 5 fotos e selo de condição    | Módulo anuncios, Amazon S3                |
| 02 Anúncios           | 005       | Simulador de ganho em tempo real e preço sugerido por tabela configurável     | Pacote compartilhado app/core/pricing     |
| 02 Anúncios           | 006       | Testes de anúncio, cálculo do líquido e bloqueio de exclusão                  | Jest + Supertest, CI da branch            |
| 03 Catálogo           | 007       | Vitrine com busca, filtros, ordenação e limpar filtros                        | Módulo catalogo, PostgreSQL full-text     |
| 03 Catálogo           | 008       | Página de detalhes com galeria e status disponível, reservada ou vendida      | Next.js (SSR/ISR), Cloudflare             |
| 03 Catálogo           | 009       | Testes de listagem, busca, filtros e detalhes                                 | Jest, Playwright                          |
| 04 Carrinho e Pix     | 010       | Carrinho com peça única e reserva por tempo limitado                          | Módulo checkout, PostgreSQL + Redis (TTL) |
| 04 Carrinho e Pix     | 011       | Checkout com endereço, frete fixo, QR Code Pix e webhook idempotente          | Módulo pagamentos, Mercado Pago, BullMQ   |
| 04 Carrinho e Pix     | 012       | Testes de reserva, geração e confirmação do Pix                               | Jest, gateway simulado                    |
| 05 Pedidos e Carteira | 013       | Status do pedido com transições validadas e confirmação de recebimento        | Módulo pedidos (máquina de estados)       |
| 05 Pedidos e Carteira | 014       | Carteira do vendedor, comissão configurável, repasse manual e ocultar anúncio | Módulos carteira e admin, livro-razão     |
| 05 Pedidos e Carteira | 015       | Testes de status, divisão do valor e alteração da comissão                    | Jest + Supertest, CI da branch            |

### 2.3 Requisitos Não Funcionais

| Requisito               | Descrição                               | Meta                                                                      | Por quê                                                                                           |
|-------------------------|-----------------------------------------|---------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Disponibilidade         | Uptime esperado                         | 99,5% no MVP; 99,9% após maturidade                                       | 99,9% exige redundância completa e encarece; 99,5% (cerca de 3,6 h por mês) é aceitável no início |
| Performance             | Tempo de resposta                       | API p95 \< 300 ms; LCP \< 2,5 s; simulador de ganho atualiza em \< 100 ms | O simulador roda no navegador a cada tecla; vitrine com muitas fotos exige otimização de imagem   |
| Escalabilidade          | Crescimento                             | Horizontal nos componentes de aplicação                                   | Campanhas geram picos; novas instâncias absorvem o tráfego                                        |
| Segurança               | Conformidade                            | LGPD, OWASP Top 10                                                        | CPF e chave Pix são dados pessoais; o Pix é tratado pelo gateway                                  |
| Manutenibilidade        | Evolução                                | Alta; cada módulo com testes próprios e CI verde                          | Cinco pessoas trabalham em paralelo, uma por módulo                                               |
| Consistência de estoque | Nunca vender a mesma peça duas vezes    | 0 vendas duplicadas                                                       | Cada peça é única; venda dupla gera cancelamento e perda de confiança                             |
| Exatidão financeira     | Divisão entre vendedor, comissão e taxa | Diferença de 0 centavo; valores em centavos inteiros                      | Erro de arredondamento vira dinheiro faltando no repasse                                          |
| Idempotência            | Webhook de pagamento repetido           | 0 efeitos duplicados                                                      | O gateway reenvia notificações; o pedido não pode ser pago duas vezes                             |

## 3. Arquitetura Geral

### 3.1 Estilo Arquitetural

**Escolha:** monolito modular, com um único backend dividido em 5 módulos de negócio (um por integrante) mais um núcleo compartilhado app/core, e processamento assíncrono em workers.

**Por quê:**

- Time de 5 estudantes: microsserviços multiplicariam deploys, redes e monitoramento sem ganho nessa escala.

- Reserva, pedido, pagamento e carteira precisam de transações consistentes. No monolito isso é uma transação de banco; em microsserviços exigiria sagas e consistência eventual.

- Os módulos têm fronteiras claras e casam com a divisão do trabalho: cada pessoa evolui o seu em branch própria, com testes e CI próprios.

- Serverless puro foi descartado por conexões de banco, cold start e custo imprevisível no checkout.

**Como cada módulo funciona sozinho:** os módulos se comunicam apenas por interfaces publicadas em app/core (ex.: CatalogoPort.reservarPeca(), CarteiraPort.registrarVenda()), nunca acessando tabelas de outro módulo. Nos testes de cada módulo, essas interfaces são substituídas por implementações falsas (mocks), o que permite desenvolver e testar o Módulo 04 antes de o Módulo 02 estar pronto, por exemplo. Alterações em app/core/\* exigem justificativa e aprovação, como definido nas regras do grupo.

### 3.2 Visão de Alto Nível

<img src="media/image1.png" style="width:6in;height:4.00893in" alt="visão de alto nível · 5 módulos, núcleo compartilhado e serviços" />

visão de alto nível · 5 módulos, núcleo compartilhado e serviços

O cliente passa pelo Cloudflare até o frontend e a API. Os cinco módulos só conversam entre si pelo núcleo app/core (destacado), e o Mercado Pago confirma o pagamento chamando a API por webhook.

### 3.3 Camadas da Arquitetura

**Camada de Apresentação (Frontend):** vitrine, páginas de peça, carrinho, checkout, área do vendedor (anúncios, simulador, carteira, vendas), área do comprador (compras) e painel do admin. Comunica-se com o backend exclusivamente via API REST.

**Camada de Aplicação (Backend / API):** regras de negócio (validação de chave Pix, cálculo do valor líquido, reserva de peça, transições de status, divisão do valor), orquestração do pagamento Pix e controle de acesso por perfil. Expõe endpoints para o frontend e recebe o webhook de pagamento.

**Camada de Dados:** PostgreSQL como fonte da verdade (contas, anúncios, pedidos, livro-razão da carteira), Redis para cache, expiração das reservas e filas, S3 para as fotos das peças.

**Camada de Infraestrutura:** AWS na região de São Paulo, contêineres gerenciados, balanceador de carga, Cloudflare na borda e monitoramento.

## 4. Componentes e Tecnologias

### 4.1 Frontend

| Item                    | Escolha                                                              | Por quê                                                                                                                                   |
|-------------------------|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Framework               | Next.js (React) com TypeScript                                       | SSR/ISR deixa as páginas de peça indexáveis no Google e boas para compartilhar em redes sociais, principal canal de um brechó comunitário |
| Gerenciamento de estado | TanStack Query (dados da API) + Zustand (carrinho e filtros)         | Quase todo o estado vem da API; Zustand é leve para o carrinho e para os filtros da vitrine (Req. 007)                                    |
| Estilização             | Tailwind CSS + componentes shadcn/ui                                 | Produtividade alta e identidade visual própria; os selos de condição (Req. 004) viram um componente único reutilizado                     |
| Build tool              | Turbopack/Next.js (embutido)                                         | O próprio Next.js já inclui o build                                                                                                       |
| Biblioteca CSS          | Tailwind CSS (escolhida entre Bootstrap, Materialize e Tailwind)     | Bootstrap e Materialize deixam o site com cara de template; Materialize está praticamente sem manutenção                                  |
| Simulador de ganho      | Função de cálculo do pacote app/core/pricing, executada no navegador | O mesmo código calcula no frontend (tempo real, Req. 005) e no backend (valor oficial do pedido), sem divergência                         |
| Formulários             | React Hook Form + Zod                                                | Valida CPF, chave Pix, CEP e campos do anúncio antes de enviar, com as mesmas regras do backend                                           |
| Imagens                 | next/image + Cloudflare (redimensionamento)                          | Galeria de até 5 fotos por peça (Req. 008) em WebP/AVIF e no tamanho certo para cada tela                                                 |
| Testes                  | Vitest, Testing Library, Playwright (E2E)                            | Playwright cobre o fluxo completo: anunciar, buscar, reservar e pagar                                                                     |

### 4.2 Backend

| Item               | Escolha                                                 | Por quê                                                                                                                  |
|--------------------|---------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Linguagem          | TypeScript (Node.js)                                    | Mesma linguagem do frontend: tipos e validações compartilhados entre os módulos e as telas                               |
| Framework          | NestJS                                                  | Impõe módulos com injeção de dependência, o que encaixa nos 5 módulos e no núcleo app/core                               |
| Protocolo de API   | REST (JSON) com documentação OpenAPI                    | Simples e cacheável; o contrato documentado permite que cada integrante consuma o módulo do outro sem depender do código |
| Autenticação       | JWT de curta duração + refresh token em cookie httpOnly | Tokens curtos limitam o dano em caso de vazamento; login com Google fica para depois do MVP                              |
| ORM                | Prisma                                                  | Tipagem forte ligada ao schema e migrations integradas                                                                   |
| Validação          | Zod / class-validator                                   | Valida CPF (dígitos verificadores), formato de cada tipo de chave Pix, preço e quantidade de fotos na borda da API       |
| Regras de status   | Máquina de estados explícita no módulo pedidos          | Rejeita transições inválidas do pedido (Req. 013) num único lugar testável                                               |
| Valores monetários | Inteiros em centavos                                    | Evita erros de arredondamento na divisão vendedor, comissão e taxa (Req. 014)                                            |
| Testes             | Jest (unitário e integração) + Supertest                | Padrão do NestJS; cada requisito de testes (003, 006, 009, 012, 015) roda na CI da sua branch                            |

### 4.3 Banco de Dados

| Item                      | Escolha                                                    | Por quê                                                                                                                             |
|---------------------------|------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Banco relacional          | PostgreSQL (Amazon RDS)                                    | Pedidos, carteira e reservas exigem transações ACID; restrições UNIQUE em e-mail e CPF garantem a rejeição de duplicados (Req. 001) |
| Banco não relacional      | Não adotar no MVP                                          | Os dados são relacionais; atributos variáveis por categoria cabem em colunas JSONB                                                  |
| Cache / filas             | Redis (Amazon ElastiCache)                                 | Cache da vitrine, expiração das reservas (TTL), rate limiting e filas em uma só tecnologia                                          |
| Busca                     | PostgreSQL full-text, sem diferenciar maiúsculas e acentos | Atende busca por título, descrição e marca (Req. 007); Meilisearch entra só se o catálogo crescer muito                             |
| Armazenamento de arquivos | Amazon S3                                                  | Fotos fora do banco e do servidor; barato, durável e integrado à CDN                                                                |
| Migrations                | Prisma Migrate                                             | Schema versionado com o código; cada módulo mantém suas próprias tabelas                                                            |

**Principais entidades:** Usuario, PerfilVendedor (chave Pix criptografada), Anuncio, FotoAnuncio, TabelaPrecoSugerido, Reserva, Pedido, ItemPedido, CobrancaPix, EventoWebhook, LancamentoCarteira, Repasse e ConfiguracaoPlataforma (comissão, taxa Pix, frete fixo, tempo de reserva).

### 4.4 Infraestrutura e DevOps

| Item               | Escolha                                                                                        | Por quê                                                                                                               |
|--------------------|------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Cloud provider     | AWS (região sa-east-1, São Paulo)                                                              | Menor latência para o público e dados armazenados no Brasil, o que simplifica a LGPD                                  |
| Contêineres        | Docker + AWS ECS Fargate                                                                       | Roda contêineres sem gerenciar servidores; Kubernetes seria excesso para o time                                       |
| CI/CD              | GitHub Actions                                                                                 | Cada integrante mantém o workflow da sua branch feature/\<numero\>-\<slug\>; o merge na main exige CI verde e revisão |
| Gestão do trabalho | GitHub Issues com labels mvp, vendedor, comprador, admin, pagamento, backend, frontend, testes | Os 15 requisitos viram 15 issues rastreáveis até o código                                                             |
| Infra como código  | Terraform                                                                                      | Ambientes reproduzíveis e revisáveis                                                                                  |
| Monitoramento      | Grafana Cloud (métricas) + Sentry (erros)                                                      | Bom custo-benefício; Sentry mostra o erro exato no código                                                             |
| Logs               | Amazon CloudWatch Logs                                                                         | Já integrado ao ECS, sem operar um ELK Stack                                                                          |
| CDN / WAF          | Cloudflare                                                                                     | Cache de imagens e páginas, proteção contra bots e firewall, com plano gratuito                                       |

## 5. Fluxo de Dados e Integrações

### 5.1 Fluxo Principal de Requisição (venda de uma peça)

1.  **Anúncio (Req. 004 e 005):** o vendedor, já com chave Pix cadastrada, preenche o anúncio. O simulador mostra preço, comissão, taxa Pix e valor líquido a cada tecla. As fotos sobem direto para o S3 por URL pré-assinada, e a API grava o anúncio como ativo.

2.  **Vitrine (Req. 007 e 008):** o comprador busca e filtra peças. O Cloudflare serve páginas e fotos do cache; se não houver, o Next.js renderiza buscando dados na API.

3.  **Carrinho (Req. 010):** a peça entra no carrinho com quantidade 1. Ainda não há reserva, então outro comprador pode continuar vendo a peça como disponível.

4.  **Início do checkout (Req. 010):** a API, numa transação, executa UPDATE ... WHERE status = 'disponivel' para marcar a peça como reservada e grava a reserva com prazo (ex.: 15 minutos). Se a peça já estiver reservada ou vendida, o checkout é bloqueado com mensagem clara.

5.  **Resumo e Pix (Req. 011):** o comprador informa endereço com CEP e vê peças, frete fixo e total. A API cria o pedido como aguardando pagamento, congela no pedido o percentual de comissão vigente e gera a cobrança no Mercado Pago, que devolve QR Code, código copia-e-cola e prazo de expiração.

6.  **Confirmação (Req. 011):** o Mercado Pago envia o webhook. O backend valida a assinatura, grava o ID do evento e, se for novo, muda o pedido para pago e a peça para vendida. Um evento repetido é ignorado.

7.  **Carteira (Req. 014):** no pagamento, o módulo carteira registra três lançamentos: valor do vendedor (saldo pendente), comissão e taxa Pix.

8.  **Entrega (Req. 013):** o vendedor marca como enviado e o comprador confirma o recebimento. O saldo do vendedor passa de pendente para disponível.

9.  **Repasse (Req. 014):** o admin faz o Pix ao vendedor fora do sistema e registra o repasse, que debita o saldo disponível.

10. **Expiração:** se a reserva ou o Pix vencerem sem pagamento, um job cancela o pedido e devolve a peça ao catálogo como disponível.

**Por que assim:** a confirmação vem por webhook, e não pelo navegador, porque o comprador pode fechar a aba. A reserva só no início do checkout evita que carrinhos esquecidos travem peças únicas. A comissão congelada no pedido garante que mudar o percentual só afete vendas futuras (Req. 014).

### 5.2 Integrações Externas

| Serviço               | Finalidade                                       | Protocolo              | Responsável | Por quê                                                                                      |
|-----------------------|--------------------------------------------------|------------------------|-------------|----------------------------------------------------------------------------------------------|
| Mercado Pago          | Cobrança Pix com QR Code e copia-e-cola          | REST + Webhook         | Módulo 04   | Pix nativo, sandbox gratuito e taxa competitiva; cartão e boleto ficam prontos para a fase 2 |
| Amazon S3             | Fotos dos anúncios                               | SDK (URL pré-assinada) | Módulo 02   | O navegador envia a foto direto ao S3, sem passar pelo servidor                              |
| ViaCEP                | Preencher o endereço a partir do CEP no checkout | REST                   | Módulo 04   | Gratuito e reduz erro de digitação                                                           |
| Sentry                | Monitoramento de erros                           | SDK                    | Time DevOps | Diagnóstico rápido em produção                                                               |
| Melhor Envio (fase 2) | Frete calculado, etiquetas e rastreio            | REST + Webhook         | Módulo 05   | Substitui o frete fixo quando sair do MVP                                                    |
| Amazon SES (fase 2)   | E-mails transacionais e recuperação de senha     | SDK / SMTP             | Módulo 01   | Notificações por e-mail estão fora do MVP                                                    |

Cada fornecedor fica atrás de uma interface própria em app/core (ex.: PagamentoProvider). No MVP existem duas implementações: MercadoPagoProvider e PixSimuladoProvider, usado em desenvolvimento e nos testes do Req. 012 para simular confirmação, confirmação repetida e expiração.

### 5.3 Eventos e Mensageria

**Escolha:** BullMQ sobre Redis para filas assíncronas.

**Processados de forma assíncrona:**

- processamento do webhook de pagamento (recebe, grava o evento e responde rápido ao gateway);

- expiração de reservas e de cobranças Pix vencidas, liberando a peça;

- geração de miniaturas das fotos enviadas;

- registro dos lançamentos na carteira após o pagamento.

**Por quê:** o Redis já existe na arquitetura, então não há componente extra para operar. RabbitMQ e Kafka são feitos para volumes muito maiores. Se a confiabilidade das filas virar requisito crítico, a migração para Amazon SQS é direta, porque a camada de worker fica isolada.

## 6. Segurança

### 6.1 Autenticação e Autorização

| Perfil    | Pode fazer                                                                                  | Regra de posse                                                                      |
|-----------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| Comprador | Buscar, reservar, pagar, ver suas compras, confirmar recebimento                            | Só confirma recebimento de pedidos em que é o comprador                             |
| Vendedor  | Tudo do comprador + anunciar, ver simulador, carteira e vendas, marcar como enviado         | Só edita, pausa ou exclui os próprios anúncios; só marca envio dos próprios pedidos |
| Admin     | Definir comissão, frete fixo e tabela de preço sugerido; registrar repasse; ocultar anúncio | Não compra nem vende com a conta de admin                                           |

- Autorização por papéis (RBAC) e por posse do recurso, sempre validada no backend; o frontend apenas esconde opções.

- O papel de vendedor só libera a publicação de anúncios quando existe chave Pix válida cadastrada (Req. 002).

- Senhas com hash Argon2id; bloqueio temporário após tentativas falhas de login.

- Painel do admin restrito ao perfil admin no MVP; autenticação em dois fatores (2FA) obrigatória a partir da fase 2.

**Por quê:** o admin controla comissão e repasses, e a conta do vendedor define para onde vai o dinheiro. Um acesso indevido a qualquer um dos dois gera prejuízo direto.

### 6.2 Proteção de Dados

- **Em trânsito:** TLS 1.2+ (HTTPS obrigatório com HSTS).

- **Em repouso:** criptografia no RDS, S3 e ElastiCache (KMS).

- **CPF e chave Pix:** criptografados no nível do campo; a chave Pix é exibida mascarada (ex.: \*\*\*.456.789-\*\*), e o CPF nunca aparece no perfil público nem na página da peça. Para impedir CPF duplicado sem descriptografar, a busca usa um hash do CPF.

- **Pagamento:** a cobrança Pix é feita pelo Mercado Pago; nenhum dado bancário do comprador passa pelo sistema.

- **LGPD:** coleta mínima (só o necessário para vender e entregar), base legal registrada, política de privacidade, canal para o titular exportar ou excluir seus dados e anonimização de pedidos antigos quando a exclusão for pedida. O endereço do comprador só é visível ao vendedor daquele pedido.

**Por quê:** CPF, endereço e chave Pix são dados pessoais. A LGPD prevê sanções relevantes, e um vazamento de chaves Pix permitiria golpes contra os vendedores.

### 6.3 Gestão de Segredos

**Escolha:** AWS Secrets Manager, com permissões por IAM mínimas por serviço. Arquivos .env existem apenas localmente, fora do repositório (.gitignore), e a CI de cada branch roda detecção de segredos (gitleaks).

**Por quê:** cinco pessoas trabalham em branches separadas, o que aumenta a chance de alguém subir uma chave por engano. Uma credencial do Mercado Pago vazada dá prejuízo direto.

### 6.4 Práticas de Segurança Aplicadas

Validação e sanitização de entradas, consultas parametrizadas via ORM (proteção contra SQL Injection), escape de saída e CSP (proteção contra XSS na descrição dos anúncios), rate limiting em cadastro, login, busca e checkout, CORS restrito por ambiente, cabeçalhos de segurança (Helmet), WAF do Cloudflare, validação de assinatura e idempotência no webhook, upload de fotos com validação de tipo, tamanho e limite de 5 por anúncio, dependências auditadas (Dependabot), análise estática (CodeQL) e varredura de imagens Docker no pipeline.

## 7. Escalabilidade e Performance

### 7.1 Estratégia de Escalabilidade

Backend e frontend escalam horizontalmente: ambos são stateless, então o ECS adiciona ou remove instâncias por uso de CPU e requisições. O banco escala verticalmente no início, com réplica de leitura para a vitrine quando necessário. Reservas, sessões e filas vivem no Redis e no Postgres, nunca na memória das instâncias.

**Por quê:** o gargalo típico é leitura (navegar na vitrine). Escritas sensíveis, como reserva, pagamento e carteira, continuam no banco principal.

### 7.2 Estratégia de Cache

| Camada   | Técnica                                                                                | Por quê                                                                                   |
|----------|----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| Borda    | Cloudflare cacheia fotos e páginas estáticas                                           | A maior parte do peso são fotos de até 5 por peça                                         |
| Frontend | ISR nas páginas de peça e categoria, revalidadas quando a peça muda de status          | Páginas rápidas e boas para SEO, sem mostrar peça vendida como disponível por muito tempo |
| API      | Redis para listagens e filtros populares (TTL curto) e para a tabela de preço sugerido | Reduz carga no banco em picos                                                             |
| Banco    | Índices em categoria, tamanho, condição, status, preço e data de criação               | Cobrem os filtros e ordenações do Req. 007                                                |

Status da peça, preço e comissão no momento do checkout nunca vêm do cache; são sempre lidos do banco, para não vender uma peça já reservada ou vendida.

### 7.3 Balanceamento de Carga

AWS Application Load Balancer (ALB) distribuindo o tráfego entre as tarefas do ECS em múltiplas zonas de disponibilidade, com health checks. O Cloudflare fica à frente como proxy e proteção.

**Por quê:** o ALB é gerenciado, integra com o ECS e remove instâncias com falha automaticamente.

## 8. Disponibilidade e Recuperação

### 8.1 Estratégia de Backup

- **PostgreSQL (RDS):** backups automáticos diários com retenção de 14 dias e recuperação para qualquer ponto no tempo (PITR).

- **S3 (fotos):** versionamento ativado e replicação para outra região.

- **Teste de restauração** trimestral, porque backup que nunca foi restaurado não é garantia.

**Por quê:** o livro-razão da carteira registra quanto a plataforma deve a cada vendedor. Perder esse histórico significa não saber quanto repassar.

### 8.2 Plano de Recuperação de Desastres (DR)

| Indicador                         | Meta      | Justificativa                                                                                            |
|-----------------------------------|-----------|----------------------------------------------------------------------------------------------------------|
| RPO (perda máxima de dados)       | 5 minutos | O PITR do RDS permite essa granularidade; pedidos pagos e lançamentos de carteira não podem ser perdidos |
| RTO (tempo máximo de recuperação) | 4 horas   | Compatível com o orçamento; o Terraform permite recriar o ambiente rapidamente                           |

**Procedimento:** banco multi-AZ com failover automático. Em falha regional, restaurar o banco em outra região e subir a infraestrutura via Terraform, apontando o DNS para o novo ambiente. Após a retomada, reprocessar webhooks do Mercado Pago recebidos durante a falha, consultando o status das cobranças pendentes na API do gateway.

### 8.3 Health Checks e Alertas

- Endpoints /health/live (processo ativo) e /health/ready (banco e Redis acessíveis).

- Alertas (e-mail ou Discord da equipe) para: taxa de erros 5xx acima de 2%, latência p95 acima de 800 ms, fila de jobs acumulada, falha no webhook de pagamento, job de expiração de reservas parado e conexões do banco acima de 80%.

- Monitor externo de disponibilidade (ex.: UptimeRobot) para a vitrine e o checkout.

## 9. Ambientes

| Ambiente        | Finalidade                                                  | URL / Endereço                | Observações                                                                              |
|-----------------|-------------------------------------------------------------|-------------------------------|------------------------------------------------------------------------------------------|
| Desenvolvimento | Desenvolvimento local de cada módulo                        | localhost (Docker Compose)    | Postgres, Redis e S3 simulado (MinIO) sobem com um comando; Pix pelo PixSimuladoProvider |
| CI da branch    | Testes automáticos de cada requisito                        | GitHub Actions                | Banco e Redis temporários por execução; roda os testes do módulo e o gitleaks            |
| Homologação     | Testes integrados dos 5 módulos e validação com o professor | homolog.\[domínio a definir\] | Espelho da produção em menor escala, dados fictícios, Mercado Pago em sandbox            |
| Produção        | Uso pelos usuários finais                                   | www.\[domínio a definir\]     | Multi-AZ, backups e monitoramento completos                                              |

**Por quê:** a homologação é onde os módulos desenvolvidos separadamente se encontram pela primeira vez, sem risco de cobrar Pix real. Dados reais de clientes, como CPF e chave Pix, nunca são copiados para ambientes de teste (LGPD).

## 10. Decisões Arquiteturais

### ADR-001: Monolito modular com um módulo por integrante

**Contexto:** 5 integrantes, cada um responsável por um módulo que precisa funcionar e ser testado sozinho; o fluxo de compra exige consistência.

**Decisão:** um backend NestJS com 5 módulos isolados, que se comunicam só por interfaces em app/core, mais workers para tarefas assíncronas.

**Consequências:** (+) deploy simples, transações locais, trabalho paralelo sem conflitos. (−) app/core vira ponto de acoplamento; mitigado pela regra de não alterá-lo sem justificativa e aprovação.

### ADR-002: TypeScript de ponta a ponta com cálculo de preço compartilhado

**Contexto:** o simulador precisa responder em tempo real no navegador, mas o valor cobrado tem de ser calculado no servidor.

**Decisão:** Next.js e NestJS em TypeScript; a função de cálculo de comissão, taxa e valor líquido fica em app/core/pricing e é usada pelos dois lados.

**Consequências:** (+) o vendedor vê exatamente o valor que vai receber. (−) mudanças no cálculo exigem novo deploy do frontend e do backend juntos.

### ADR-003: Reserva de peça única no início do checkout, com bloqueio transacional e expiração

**Contexto:** cada peça existe uma única vez; vender duas vezes é o pior erro possível.

**Decisão:** o carrinho não reserva. A reserva acontece ao iniciar o checkout, com UPDATE ... WHERE status = 'disponivel' no PostgreSQL, prazo controlado por TTL no Redis e job de limpeza.

**Consequências:** (+) garantia contra venda duplicada e carrinhos esquecidos não travam peças. (−) o comprador pode perder a peça entre o carrinho e o checkout; a vitrine mostra o status "reservada" para reduzir a frustração.

### ADR-004: PostgreSQL como banco principal, sem NoSQL no MVP

**Contexto:** dados relacionais e transacionais, com atributos variáveis por categoria.

**Decisão:** PostgreSQL com JSONB para atributos flexíveis e full-text search nativo.

**Consequências:** (+) um banco só, menos custo. (−) busca tolerante a erros de digitação pode exigir Meilisearch no futuro.

### ADR-005: Somente Pix no MVP, via gateway, com webhook idempotente

**Contexto:** o público usa Pix no dia a dia e cartão e boleto aumentam taxas, prazos e escopo de segurança.

**Decisão:** Mercado Pago atrás da interface PagamentoProvider, apenas Pix; webhook assinado e processado de forma idempotente pelo ID do evento; implementação simulada para desenvolvimento e testes.

**Consequências:** (+) menor escopo e testes sem custo. (−) dependência de terceiro; cartão e boleto entram depois com nova implementação da mesma interface.

### ADR-006: Carteira como livro-razão e repasse manual

**Contexto:** a plataforma recebe o dinheiro e repassa ao vendedor só após a entrega; a comissão pode mudar com o tempo.

**Decisão:** a carteira não guarda um saldo editável. Cada movimento é um lançamento imutável (venda pendente, liberação, comissão, taxa, repasse), e o saldo é a soma deles. O percentual de comissão é copiado para o pedido no checkout. O repasse é feito manualmente pelo admin.

**Consequências:** (+) extrato auditável e mudança de comissão sem afetar pedidos antigos. (−) o repasse manual não escala; repasse automático está previsto fora do MVP.

### ADR-007: ECS Fargate em vez de Kubernetes

**Contexto:** time sem equipe dedicada de infraestrutura.

**Decisão:** contêineres no ECS Fargate, infraestrutura em Terraform.

**Consequências:** (+) pouca operação e escala automática. (−) menos portabilidade entre nuvens; aceitável nesta fase.

### ADR-008: Renderização no servidor (SSR/ISR) para o frontend

**Contexto:** as peças serão divulgadas principalmente por links em redes sociais e pela busca do Google.

**Decisão:** Next.js com SSR/ISR nas páginas públicas e dados estruturados (schema.org Product).

**Consequências:** (+) SEO e boa pré-visualização ao compartilhar uma peça. (−) exige revalidar o cache quando a peça muda de status.

## 11. Glossário

| Termo            | Definição                                                                                              |
|------------------|--------------------------------------------------------------------------------------------------------|
| ACID             | Propriedades de transações de banco: atomicidade, consistência, isolamento e durabilidade              |
| API              | Interface de Programação de Aplicações                                                                 |
| CDN              | Rede de Distribuição de Conteúdo                                                                       |
| Chave Pix        | Identificador (CPF, e-mail, telefone ou aleatória) para onde o vendedor recebe o repasse               |
| CI/CD            | Integração e Entrega Contínua                                                                          |
| Comissão         | Percentual retido pela plataforma em cada venda, definido pelo admin                                   |
| Idempotência     | Propriedade de uma operação que, repetida, produz o mesmo resultado (ex.: webhook recebido duas vezes) |
| ISR              | Regeneração incremental: páginas geradas antecipadamente e atualizadas em segundo plano                |
| JWT              | JSON Web Token                                                                                         |
| LGPD             | Lei Geral de Proteção de Dados (Lei 13.709/2018)                                                       |
| Livro-razão      | Registro imutável de lançamentos financeiros cuja soma forma o saldo                                   |
| Monolito modular | Aplicação única, organizada internamente em módulos independentes                                      |
| PITR             | Recuperação do banco para qualquer ponto no tempo                                                      |
| RBAC             | Controle de acesso baseado em papéis                                                                   |
| Repasse          | Transferência Pix do admin ao vendedor do saldo disponível                                             |
| Reserva          | Bloqueio temporário de uma peça durante o checkout                                                     |
| RPO              | Recovery Point Objective: quantidade máxima de dados que se aceita perder                              |
| RTO              | Recovery Time Objective: tempo máximo aceitável para restabelecer o sistema                            |
| SSR              | Renderização no servidor                                                                               |
| TTL              | Time to Live: tempo até um dado expirar automaticamente                                                |
| Valor líquido    | Preço da peça menos comissão e taxa do Pix, valor que o vendedor recebe                                |
| Webhook          | Chamada que um serviço externo faz ao sistema para avisar de um evento                                 |

## 12. Histórico de Revisões

| Versão | Data       | Autor                 | Descrição das Alterações                                                                                                                                                                             |
|--------|------------|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2.0    | 30/10/2026 | Equipe de Arquitetura | Arquitetura adaptada ao brechó comunitário e aos 15 requisitos do MVP: perfis Vendedor, Comprador e Admin; somente Pix; frete fixo; carteira e repasse manual; módulos alinhados à divisão da equipe |
| 1.0    | 29/10/2026 | Equipe de Arquitetura | Criação do documento (loja de vendedor único)                                                                                                                                                        |
