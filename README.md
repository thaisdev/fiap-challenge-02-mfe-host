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

A API já está disponível publicamente em **http://3.148.238.85:3333**. Basta configurar a variável de ambiente apontando para esse endereço (veja o passo 3).

**Opção B — Rodar a API localmente**

1. Clone o repositório da API:

```bash
git clone https://github.com/thaisdev/fiap-techchallenge-02-api
```

2. Siga as instruções do `README` do repositório clonado para instalar e iniciar a API.

A API ficará disponível em **http://localhost:3333**.

### 3. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o conteúdo adequado à opção escolhida:

- **API publicada:**

```env
API_URL=http://3.148.238.85:3333
```

- **API local:**

```env
API_URL=http://localhost:3333
```

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

Escolha a opção de acordo com onde a API está rodando:

**API publicada:**

```bash
docker run -e API_URL=http://3.148.238.85:3333 -p 3000:3000 mcintosh-bank
```

**API rodando localmente:**

```bash
docker run -e API_URL=http://host.docker.internal:3333 -p 3000:3000 mcintosh-bank
```

> `host.docker.internal` é o hostname especial do Docker Desktop que aponta para a máquina host. Não use `localhost` dentro do container, pois ele se refere ao próprio container.

Acesse: http://localhost:3000

---

## Observações

- O projeto utiliza **TypeScript** em modo estrito e segue padrões de organização e colocation recomendados para projetos Next.js modernos.
- Todos os componentes de interface são próprios, desenvolvidos internamente no projeto. A documentação e exemplos de uso desses componentes podem ser consultados no **Storybook**.
- Para detalhes sobre arquitetura, convenções e padrões, consulte o arquivo `AGENTS.md`.
