## Mcintosh Bank

O **Mcintosh Bank** é um produto fictício criado para fins educacionais, simulando uma experiência moderna de internet banking. O objetivo é proporcionar uma interface intuitiva e responsiva para gestão de contas, transações e serviços bancários digitais.

---

## Sobre o Projeto

Este repositório faz parte do **Tech Challenge** da pós-graduação em Frontend da FIAP. O desafio consiste em desenvolver uma aplicação web utilizando as melhores práticas do ecossistema React/Next.js, com foco em qualidade de código, experiência do usuário e organização de projeto.

---

## Funcionalidades

### Disponíveis

- Cadastro e login de usuário
- Visualização de resumo da conta
- Consulta de extrato bancário
- Efetuar transação
- Alterar ou excluir uma transação

### Em construção

- Serviços bancários adicionais (pagamentos, transferências, recarga, etc.)

---

## Tecnologias e Versões Utilizadas

- **Next.js**: 16.2.1
- **React**: 19
- **TypeScript**: 5
- **Tailwind CSS**: 4
- **Storybook**: 10.3.0

---

## Como rodar o projeto localmente

### 1. Pré-requisitos

- Node.js **20.19.5** ou superior (menor que 21)
- npm **10.x** (menor que 11)

### 2. Subindo a API

A aplicação depende de uma API REST externa. Você tem duas opções:

**Opção A — Usar a API publicada (mais rápido)**

A API já está disponível publicamente em **http://18.116.12.234:3333**. Basta configurar a variável de ambiente apontando para esse endereço (veja o passo 3).

**Opção B — Rodar a API localmente**

1. Clone o repositório da API:

```bash
git clone https://github.com/thaisdev/fiap-techchallenge-02-api
```

2. Siga as instruções do `README` do repositório clonado para instalar e iniciar a API.

A API ficará disponível em **http://localhost:3333**.

### 3. Variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Abaixo a descrição de cada variável:

**`API_URL`** — endereço da API REST.

- API publicada: `http://18.116.12.234:3333`
- API local: `http://localhost:3333`

**`NEXT_PUBLIC_FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL`** — URL do microfrontend Angular de visibilidade financeira.

**Opção A — Usar o microfrontend publicado (mais rápido)**

O microfrontend já está disponível publicamente. Configure a variável com a URL de produção:

```env
NEXT_PUBLIC_FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL=https://d102z2e77k7t5v.cloudfront.net/remoteEntry.json
```

**Opção B — Rodar o microfrontend localmente**

Clone o repositório e siga as instruções do README dele:

```bash
git clone https://github.com/guiizis/angular-mfe-tech-challenge-2
```

Após iniciar, o microfrontend ficará disponível em `http://localhost:4201/remoteEntry.json`. Configure a variável com esse valor:

```env
NEXT_PUBLIC_FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL=http://localhost:4201/remoteEntry.json
```

**`BLOB_READ_WRITE_TOKEN`** — token de acesso ao [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).

- Se preenchido, os comprovantes de transação serão enviados para o Vercel Blob.
- Se deixado vazio, os arquivos serão salvos localmente na pasta `uploads/` (ignorada pelo git) e servidos via `/api/blob?file=<nome>`.

### 4. Instalação das dependências

```bash
npm install
```

### 5. Rodando a aplicação Next.js

```bash
npm run dev
```

Acesse: http://localhost:3000

### 6. Rodando o Storybook

```bash
npm run storybook
```

Acesse: http://localhost:6006

### 7. Rodando os testes unitários

```bash
npm run test
```

---

## Como rodar o projeto com Docker

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução

### 1. Build da imagem

Na raiz do projeto, execute:

```bash
docker build -t mcintosh-bank .
```

### 2. Subindo o container

Escolha a opção de acordo com onde a API está rodando e como deseja armazenar os comprovantes.

**Com API publicada e Vercel Blob:**

```bash
docker run \
  -e API_URL=http://18.116.12.234:3333 \
  -e BLOB_READ_WRITE_TOKEN=<seu_token> \
  -p 3000:3000 \
  mcintosh-bank
```

**Com API publicada e armazenamento local (sem Vercel Blob):**

```bash
docker run \
  -e API_URL=http://18.116.12.234:3333 \
  -v uploads:/app/uploads \
  -p 3000:3000 \
  mcintosh-bank
```

> O volume `-v uploads:/app/uploads` persiste os arquivos enviados entre reinicializações do container. Sem ele, os uploads serão perdidos ao recriar o container.

**Com API rodando localmente:**

```bash
docker run \
  -e API_URL=http://host.docker.internal:3333 \
  -e BLOB_READ_WRITE_TOKEN=<seu_token> \
  -p 3000:3000 \
  mcintosh-bank
```

> `host.docker.internal` é o hostname especial do Docker Desktop que aponta para a máquina host. Não use `localhost` dentro do container, pois ele se refere ao próprio container.

Acesse: http://localhost:3000

---

## Observações

- O projeto utiliza **TypeScript** em modo estrito e segue padrões de organização e colocation recomendados para projetos Next.js modernos.
- Todos os componentes de interface são próprios, desenvolvidos internamente no projeto. A documentação e exemplos de uso desses componentes podem ser consultados no **Storybook**.
- Para detalhes sobre arquitetura, convenções e padrões, consulte o arquivo `AGENTS.md`.
