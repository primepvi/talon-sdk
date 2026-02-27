# @talon/sdk

Biblioteca TypeScript para abstrair a comunicação entre nodes Talon e um painel de controle. A conexão é baseada em WebSocket — simplificando, é como se cada node fosse um bot do Discord que se conecta ao painel e aguarda comandos.

> ⚠️ **Projeto em desenvolvimento. A API pode mudar.**

---

## Como funciona

O painel cria um servidor WebSocket e aguarda conexões. Os nodes, ao iniciar, conectam nesse servidor usando a URL e o token configurados neles.

---

## Protocolo

Todas as mensagens seguem o mesmo formato base:

```json
{
  "type": "tipo-da-mensagem",
  "correlation_id": "id-da-mensagem",
  "payload": {}
}
```

---

## Registro

Quando um node inicia, ele conecta ao painel e envia o token no header:

```
Authorization: Bearer <token>
```

O painel deve verificar se esse token está correto — funciona como uma senha. Se estiver incorreto, a conexão deve ser recusada. Se estiver correto, o node envia o evento `node.register` com suas informações:

```json
{
  "type": "node.register",
  "correlation_id": "id-da-mensagem",
  "payload": {
    "node_id": "id-do-node",
    "version": "versão-do-talon"
  }
}
```

O painel deve guardar os nodes registrados para poder enviar comandos a eles posteriormente.

---

## Eventos Disponíveis

### `app.create`

Evento enviado pelo painel para registrar uma aplicação em um node. Ele apenas registra — não coloca nada para rodar.

> **OBS:** Esse evento pode mudar no futuro.

Existem duas estratégias disponíveis:

#### Registry

Usa uma imagem já pronta disponível no Docker Hub. Ideal para bancos de dados, servidores de jogos, etc.

```json
{
  "type": "app.create",
  "correlation_id": "id-da-mensagem",
  "payload": {
    "app_id": "id-do-app",
    "name": "nome-do-app",
    "image": "imagem:tag",
    "strategy": "registry",
    "resources": { "cpu": 0.5, "memory": 512 },
    "env": { "NOME": "VALOR" }
  }
}
```

- `memory` é em MB.
- `env` é opcional.

#### Dockerfile

Clona um repositório do GitHub e builda a imagem a partir do Dockerfile na raiz do projeto.

```json
{
  "type": "app.create",
  "correlation_id": "id-da-mensagem",
  "payload": {
    "app_id": "id-do-app",
    "name": "nome-do-app",
    "strategy": "dockerfile",
    "resources": { "cpu": 0.5, "memory": 512 },
    "env": { "NOME": "VALOR" },
    "repo": "https://github.com/user/repo",
    "branch": "main",
    "commit": "hash-do-commit"
  }
}
```

- `branch` é opcional, `main` por padrão.
- `commit` é opcional, o mais recente por padrão.
- `env` é opcional.

Exemplo de Dockerfile básico para um projeto Node:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "-e", "console.log('Hello!'); setInterval(() => {}, 1000);"]
```

O node responde com um `ack`:

```json
{
  "type": "ack",
  "correlation_id": "id-da-mensagem-enviada-pelo-painel",
  "payload": {
    "status": "accepted",
    "reason": "mensagem de erro caso o status for rejected"
  }
}
```

---

### `app.deploy`

Pega as informações de um app já registrado e tenta rodá-lo. Deve ser usado após o `app.create`, ou seja, após receber o `ack` do `app.create` com status `accepted`.

> `app.create` e `app.deploy` são usados apenas na criação. Se o app já existir, use `app.redeploy`.

```json
{
  "type": "app.deploy",
  "correlation_id": "id-da-mensagem",
  "payload": {
    "app_id": "id-do-app",
    "deploy_id": "id-do-deploy"
  }
}
```

O node responde com um `ack`. Se tudo estiver certo para fazer o deploy, vem `accepted`. Quando o deploy terminar, o painel recebe um `app.state` com o resultado. Se vier `rejected`, o deploy foi recusado.

---

### `app.state`

Evento enviado pelo node ao painel sempre que o estado de uma app muda. O `correlation_id` corresponde ao comando que gerou a mudança. Eventos espontâneos como crashes enviam `null`.

```json
{
  "type": "app.state",
  "correlation_id": "id-da-mensagem | null",
  "payload": {
    "app_id": "id-do-app",
    "deploy_id": "id-do-deploy | null",
    "state": "estado-atual",
    "reason": "mensagem de erro caso tenha falhado"
  }
}
```

`reason` é `null` em casos de sucesso e preenchido em falhas.

#### Estados possíveis

| Estado | Descrição |
|---|---|
| `deploying` | Deploy em andamento |
| `running` | App rodando normalmente |
| `stopped` | App parada intencionalmente |
| `failed` | Deploy falhou |
| `crashed` | App parou inesperadamente |
| `destroyed` | App destruída |

#### Exemplo de sucesso após `app.deploy`

```json
{
  "type": "app.state",
  "correlation_id": "id-do-deploy",
  "payload": {
    "app_id": "id-do-app",
    "deploy_id": "id-do-deploy",
    "state": "running",
    "reason": null
  }
}
```

#### Exemplo de falha

```json
{
  "type": "app.state",
  "correlation_id": "id-do-deploy",
  "payload": {
    "app_id": "id-do-app",
    "deploy_id": "id-do-deploy",
    "state": "failed",
    "reason": "healthcheck timeout"
  }
}
```