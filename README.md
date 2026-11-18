# SOMA — site interativo

Projeto estático em HTML, CSS e JavaScript, inspirado nas telas enviadas. Não precisa instalar Node.js, React ou dependências.

## Atualização — design final (arquivos .af)

O visual agora segue as telas do Affinity (SITE_DEV_01 e SITE_DEV_2), com a lógica do SOMA mantida:

- **Login:** fundo azul-claro, campos em pílula e entrada com Google, Apple e Facebook (demonstrativo).
- **Hoje** e **Minhas tarefas:** fundo claro, painel roxo da cidade, filtros em pílula e botão flutuante `+`.
- **Recompensas** (nova): tela verde com moedas e gemas e botão *Resgatar* (1 resgate por dia).
- **Planejamento, Minha cidade, Meu perfil e Metas:** azul-marinho com cartões de contorno suave.
- Menu lateral em pílulas brancas com os ícones do design (`assets/ico-*.png`).

As cores por tela ficam em `theme.css`, que é carregado depois do `style.css`. Para ajustar uma cor, mexa nas variáveis do topo desse arquivo.

## Como abrir no computador

1. Extraia a pasta `SOMA-site` do arquivo ZIP.
2. Abra `index.html` no navegador. Para testar formulários e armazenamento com um servidor local, abra o terminal dentro da pasta e execute:

   **Windows:**
   ```powershell
   py -m http.server 8000
   ```

   **macOS / Linux:**
   ```bash
   python3 -m http.server 8000
   ```

3. Acesse `http://localhost:8000`.

## Como publicar na internet

O site é estático. Para publicar, envie o conteúdo inteiro desta pasta (incluindo a pasta `assets`) para um serviço de hospedagem estática, como Netlify, Cloudflare Pages, GitHub Pages ou Vercel. Não renomeie nem mova os arquivos de dentro de `assets`, porque as telas usam esses caminhos.

## O que já funciona

- Login e criação de perfil em modo demonstrativo, além de acesso como visitante.
- Navegação entre Início, Tarefas, Planejamento, Metas, Cidade, Perfil, Conquistas e Configurações.
- Criar, editar, concluir, reabrir, filtrar, pesquisar e excluir tarefas.
- Criar/excluir compromissos e navegar entre semanas.
- Criar metas e ajustar progresso.
- Ganhar moedas e XP, evoluir níveis, construir melhorias e comprar itens da loja.
- Preferências, notificações demonstrativas e exportação dos dados em JSON.
- Layout responsivo para desktop e celular.
- Salvamento local no navegador com `localStorage`.

## Importante antes de lançar para usuários reais

Esta entrega é um **protótipo funcional de front-end**. O cadastro e o login são demonstrativos: não existe servidor, autenticação segura, recuperação de senha, sincronização entre dispositivos nem banco de dados. Os dados ficam apenas no navegador em que foram criados e podem ser apagados pelo usuário. Não use senhas reais nem apresente esta autenticação como segura.

Para um lançamento público com contas reais, será necessário conectar um backend com autenticação (por exemplo, Supabase ou Firebase), banco de dados, regras de acesso e política de privacidade. A hospedagem estática sozinha não substitui essas partes.
