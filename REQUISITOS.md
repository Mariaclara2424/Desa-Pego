# MVP do Brechó Comunitário (Desa Pego) - 15 requisitos

Brechó online comunitário: qualquer pessoa cadastra suas roupas e calçados, vê quanto vai receber pela venda e o comprador paga via Pix. São 5 módulos independentes, um por integrante, com 3 requisitos cada (15 issues). A arquitetura completa está no **Documento de Arquitetura v2.0**.

## Regras do grupo

- cada módulo funciona sozinho e se comunica com os outros apenas pelas interfaces de `app/core` (nos testes, essas interfaces são mockadas);
- cada pessoa cria os 3 requisitos do seu módulo como issues no GitHub;
- cada pessoa trabalha em uma branch própria: `feature/<numero-requisito>-<slug>`;
- cada pessoa cria testes para as 3 entregas e a CI da própria branch (GitHub Actions);
- merge na `main` só com CI verde e revisão de outra integrante;
- não alterar `app/core/*` sem justificativa e aprovação;
- nunca subir `.env` ou chaves (a CI roda gitleaks).

**Perfis:** Vendedor (quem anuncia), Comprador (quem compra) e Admin (quem administra a plataforma, ex.: Lúcia). Uma mesma conta pode comprar e vender; vira vendedora ao cadastrar a chave Pix.

**Labels:** `mvp`, `vendedor`, `comprador`, `admin`, `pagamento`, `backend`, `frontend`, `testes`

**Filtro das issues abertas:** `is:issue state:open`

### Definição de pronto (vale para todas as issues)

- [ ] critérios de aceitação atendidos
- [ ] validação no backend (o frontend só esconde opções, nunca é a barreira)
- [ ] testes do requisito passando na CI da branch
- [ ] endpoint documentado no OpenAPI (quando houver)
- [ ] revisado por outra integrante

## Módulo 01 - Contas e Perfil do Vendedor

### Issue: [001] Cadastro e Login

**Labels:** `mvp` `backend` `frontend` **Branch:** `feature/001-cadastro-login`

Permitir que qualquer pessoa crie uma conta e entre no sistema.

**Critérios de aceitação**

- [ ] cadastro com nome, e-mail, CPF e senha; CPF validado pelos dígitos verificadores;
- [ ] e-mail e CPF duplicados são rejeitados com mensagem clara (restrição `UNIQUE` no banco; CPF comparado por hash, sem descriptografar);
- [ ] senha guardada com hash Argon2id e nunca devolvida pela API;
- [ ] login gera JWT de curta duração + refresh token em cookie httpOnly; logout invalida o refresh token;
- [ ] credenciais inválidas mostram erro genérico (sem dizer se o e-mail existe) e tentativas em excesso bloqueiam temporariamente.

### Issue: [002] Perfil do Vendedor com Chave Pix

**Labels:** `mvp` `vendedor` `backend` `frontend` **Branch:** `feature/002-perfil-chave-pix`

Permitir ao vendedor configurar onde recebe.

**Critérios de aceitação**

- [ ] vendedor edita nome público e cidade; CPF nunca aparece no perfil público;
- [ ] chave Pix (CPF, e-mail, telefone ou aleatória) é validada conforme o tipo, guardada criptografada e exibida mascarada;
- [ ] só quem tem chave Pix cadastrada consegue publicar anúncio (regra exposta em `app/core` para o Módulo 02).

### Issue: [003] Testes de Contas e Perfil

**Labels:** `mvp` `testes` **Branch:** `feature/003-testes-contas`

**Critérios de aceitação**

- [ ] teste cobre cadastro válido, e-mail duplicado, CPF duplicado e CPF inválido;
- [ ] teste cobre login válido, inválido e bloqueio após tentativas em excesso;
- [ ] teste cobre chave Pix válida e inválida para cada tipo, exibição mascarada e bloqueio de anúncio sem chave.

## Módulo 02 - Anúncios e Simulador de Ganho

### Issue: [004] Criar e Gerenciar Anúncio

**Labels:** `mvp` `vendedor` `backend` `frontend` **Branch:** `feature/004-anuncio`

Permitir ao vendedor anunciar e administrar suas peças.

**Critérios de aceitação**

- [ ] campos: título, descrição, categoria, tamanho, marca, condição, preço e de 1 a 5 fotos;
- [ ] fotos enviadas ao S3 por URL pré-assinada, aceitando só imagem (JPG, PNG, WebP) e com limite de tamanho;
- [ ] condição usa selos padronizados (nova com etiqueta, ótimo estado, bom estado, com marcas de uso);
- [ ] preço guardado em centavos inteiros e maior que zero;
- [ ] vendedor edita, pausa e exclui apenas os próprios anúncios, exceto peça reservada ou vendida.

### Issue: [005] Simulador de Ganho e Preço Sugerido

**Labels:** `mvp` `vendedor` `backend` `frontend` **Branch:** `feature/005-simulador-ganho`

Mostrar ao vendedor quanto ele recebe e qual preço praticar.

**Critérios de aceitação**

- [ ] exibe preço, comissão, taxa do Pix e valor líquido, atualizados em tempo real ao digitar o preço;
- [ ] o cálculo fica em `app/core/pricing` e é o mesmo usado no frontend e no backend (o valor exibido é o valor que o vendedor recebe);
- [ ] sugere faixa de preço por tabela inicial (categoria e condição) configurável pelo admin;
- [ ] vendedor pode ignorar a sugestão e definir o preço livremente.

### Issue: [006] Testes de Anúncios e Simulador

**Labels:** `mvp` `testes` **Branch:** `feature/006-testes-anuncios`

**Critérios de aceitação**

- [ ] teste cobre anúncio válido, campos obrigatórios ausentes, 0 e 6 fotos e arquivo que não é imagem;
- [ ] teste cobre cálculo do valor líquido (sem diferença de centavos), preço zero e negativo;
- [ ] teste cobre bloqueio de exclusão de peça vendida e de edição de anúncio de outro vendedor.

## Módulo 03 - Catálogo e Detalhes da Peça

### Issue: [007] Vitrine com Busca e Filtros

**Labels:** `mvp` `comprador` `backend` `frontend` **Branch:** `feature/007-vitrine-busca`

Exibir as peças ativas e permitir encontrá-las.

**Critérios de aceitação**

- [ ] lista apenas peças ativas (não pausadas, não ocultadas pelo admin, não vendidas), com foto, título, tamanho, preço e condição;
- [ ] busca por título, descrição e marca, sem diferenciar maiúsculas, minúsculas e acentos (full-text do PostgreSQL);
- [ ] filtros por categoria, tamanho, condição e faixa de preço, com ordenação por mais recentes e por preço, paginação e opção de limpar filtros.

### Issue: [008] Página de Detalhes da Peça

**Labels:** `mvp` `comprador` `frontend` **Branch:** `feature/008-detalhes-peca`

Criar a página de cada peça.

**Critérios de aceitação**

- [ ] exibe galeria de fotos, descrição, dados da peça, nome público e cidade do vendedor;
- [ ] mostra se a peça está disponível, reservada ou vendida (lido do banco, não do cache) e desabilita a compra quando indisponível;
- [ ] peça inexistente ou ocultada mostra página de erro amigável.

### Issue: [009] Testes de Catálogo e Detalhes

**Labels:** `mvp` `testes` **Branch:** `feature/009-testes-catalogo`

**Critérios de aceitação**

- [ ] teste cobre listagem somente de peças ativas (excluindo pausadas, ocultadas e vendidas);
- [ ] teste cobre busca sem acento e maiúsculas e combinação de filtros e ordenação;
- [ ] teste cobre detalhes de peça disponível, reservada, vendida e inexistente.

## Módulo 04 - Carrinho, Checkout e Pix

### Issue: [010] Carrinho com Reserva de Peça Única

**Labels:** `mvp` `comprador` `backend` `frontend` **Branch:** `feature/010-carrinho-reserva`

Impedir que duas pessoas comprem a mesma peça.

**Critérios de aceitação**

- [ ] cada peça entra no carrinho uma única vez (quantidade 1); o vendedor não pode comprar a própria peça;
- [ ] ao iniciar o checkout a peça é reservada com atualização atômica (`UPDATE ... WHERE status = 'disponivel'`) por tempo configurável (padrão 15 minutos);
- [ ] reserva expirada é liberada por job; enquanto durar, outro comprador vê a peça como reservada e não consegue iniciar o checkout.

### Issue: [011] Checkout com Pagamento Pix

**Labels:** `mvp` `comprador` `pagamento` `backend` `frontend` **Branch:** `feature/011-checkout-pix`

Finalizar a compra pagando via Pix.

**Critérios de aceitação**

- [ ] comprador informa endereço com CEP (preenchido via ViaCEP) e vê o resumo com peças, frete fixo configurável e total;
- [ ] o pedido é criado como aguardando pagamento e guarda o percentual de comissão vigente;
- [ ] sistema gera QR Code e código copia-e-cola pelo `PagamentoProvider` (Mercado Pago em homologação e produção, `PixSimuladoProvider` em desenvolvimento e testes), com prazo de expiração visível;
- [ ] webhook tem assinatura validada e é idempotente pelo ID do evento: muda o pedido para pago e a peça para vendida uma única vez, mesmo se repetido;
- [ ] Pix expirado cancela o pedido e libera a peça.

### Issue: [012] Testes de Carrinho e Pix

**Labels:** `mvp` `testes` `pagamento` **Branch:** `feature/012-testes-carrinho-pix`

**Critérios de aceitação**

- [ ] teste cobre bloqueio de peça reservada por outro comprador, duas reservas simultâneas da mesma peça e expiração da reserva;
- [ ] teste cobre geração do Pix e total do pedido (peças + frete);
- [ ] teste cobre confirmação, confirmação repetida, webhook com assinatura inválida e expiração do Pix, usando o `PixSimuladoProvider`.

## Módulo 05 - Pedidos, Carteira e Administração

### Issue: [013] Status do Pedido e Confirmação de Recebimento

**Labels:** `mvp` `comprador` `vendedor` `backend` `frontend` **Branch:** `feature/013-status-pedido`

Acompanhar o pedido da compra até a entrega.

**Critérios de aceitação**

- [ ] status: aguardando pagamento, pago, enviado, entregue e cancelado, controlados por máquina de estados que rejeita transições inválidas;
- [ ] só o vendedor do pedido marca como enviado e só o comprador do pedido confirma o recebimento;
- [ ] comprador vê suas compras e vendedor vê suas vendas, filtráveis por status; o endereço de entrega só aparece para o vendedor daquele pedido.

### Issue: [014] Carteira do Vendedor e Painel do Admin

**Labels:** `mvp` `vendedor` `admin` `backend` `frontend` **Branch:** `feature/014-carteira-admin`

Controlar o dinheiro de cada venda e a plataforma.

**Critérios de aceitação**

- [ ] a carteira é um livro-razão: cada venda paga gera lançamentos imutáveis (valor do vendedor, comissão e taxa), em centavos, e o saldo é a soma deles;
- [ ] saldo fica pendente até a confirmação de recebimento e disponível depois, com extrato consultável pelo vendedor;
- [ ] admin define o percentual de comissão, a taxa Pix, o frete fixo e a tabela de preço sugerido; a nova comissão vale só para pedidos futuros;
- [ ] admin registra manualmente o repasse Pix ao vendedor, que debita o saldo disponível e não pode ser maior que ele;
- [ ] admin consegue ocultar um anúncio indevido; só contas com perfil admin acessam o painel.

### Issue: [015] Testes de Pedidos, Carteira e Admin

**Labels:** `mvp` `testes` **Branch:** `feature/015-testes-pedidos-carteira`

**Critérios de aceitação**

- [ ] teste cobre transições válidas e inválidas de status e ação feita por usuário que não é dono do pedido;
- [ ] teste cobre divisão do valor sem diferença de centavos, liberação do saldo após o recebimento e repasse maior que o saldo;
- [ ] teste cobre alteração da comissão sem afetar pedidos antigos e acesso ao painel por quem não é admin.

## Fora do MVP

Ficam para depois da primeira entrega (a arquitetura já prevê o encaixe):

- cartão de crédito e boleto (nova implementação de `PagamentoProvider`);
- repasse e saque automáticos, e frete calculado com rastreio (Melhor Envio);
- login com Google e autenticação em dois fatores no painel do admin;
- moderação prévia de anúncios, avaliações, disputas e denúncias;
- favoritos, alertas, notificações por e-mail e recuperação de senha (Amazon SES);
- chat, FAQ e relatórios do admin;
- inovações de economia circular: contador de impacto, passaporte da peça, pontos e selos, redução automática de preço, doação, pontos de coleta e sugestão por foto com IA. O contador de impacto é o mais barato de fazer e o melhor primeiro passo depois do MVP.
