# ðŸŽ¬ GitCine â€” Contexto Atual do Backend

Documento atualizado em **22/11/2026** com o estado real da refatoraÃ§Ã£o, decisÃµes tÃ©cnicas e pendÃªncias para entrega.

---

## ðŸ“Œ VisÃ£o geral

GitCine Ã© um catÃ¡logo de filmes com autenticaÃ§Ã£o, autorizaÃ§Ã£o por perfil e avaliaÃ§Ãµes por usuÃ¡rio.

| Tecnologia | SituaÃ§Ã£o |
|---|---|
| Java 25 | Configurado |
| Spring Boot 4.1.2 | Configurado |
| Spring Web | Implementado |
| Spring Data JPA | Implementado |
| Spring Security | Implementado |
| JJWT | Implementado |
| BCrypt | Implementado |
| PostgreSQL / Neon | Banco principal configurado por variÃ¡veis de ambiente |
| SpringDoc / OpenAPI | Configurado |
| JaCoCo | Configurado |
| Testcontainers PostgreSQL e ArchUnit | DependÃªncias disponÃ­veis, testes pendentes |

### Objetivos da refatoraÃ§Ã£o

- separar domÃ­nio, aplicaÃ§Ã£o e infraestrutura;
- autenticar usuÃ¡rios com JWT;
- identificar o usuÃ¡rio pelo `userId` presente no subject;
- separar `ROLE_USER` e `ROLE_ADMIN`;
- impedir avaliaÃ§Ã£o duplicada por usuÃ¡rio e filme;
- recalcular mÃ©dia e quantidade de avaliaÃ§Ãµes;
- manter o backend independentemente do schema do Neon;
- impedir que regras fiquem nos controllers.

---

## ðŸ§± Arquitetura hexagonal

```mermaid
flowchart LR
    C[REST Controller] --> U[Use Case]
    U --> D[Domain]
    U --> P[Output Port]
    P --> A[Infrastructure Adapter]
    A --> B[(Neon)]

    style C fill:#dbeafe,stroke:#2563eb
    style U fill:#dcfce7,stroke:#16a34a
    style D fill:#fef3c7,stroke:#d97706
    style P fill:#f3e8ff,stroke:#9333ea
    style A fill:#fee2e2,stroke:#dc2626
    style B fill:#e5e7eb,stroke:#4b5563
```

### Estrutura ativa

```text
com.dsmovie
â”œâ”€â”€ domain
â”‚   â”œâ”€â”€ model
â”‚   â”œâ”€â”€ service
â”‚   â”œâ”€â”€ validation
â”‚   â””â”€â”€ exception
â”œâ”€â”€ application
â”‚   â”œâ”€â”€ dto
â”‚   â”œâ”€â”€ mapper
â”‚   â”œâ”€â”€ port/in
â”‚   â”œâ”€â”€ port/out
â”‚   â””â”€â”€ useCase
â””â”€â”€ infrastructure
    â”œâ”€â”€ config
    â”œâ”€â”€ exception
    â”œâ”€â”€ persistence
    â”‚   â”œâ”€â”€ entity
    â”‚   â”œâ”€â”€ repository
    â”‚   â””â”€â”€ adapter
    â”œâ”€â”€ rest
    â””â”€â”€ security
```

O backend legado em `com.devsuperior.dsmovie` foi removido.

---

## ðŸ” AutenticaÃ§Ã£o JWT

### Fluxo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as AuthController
    participant S as AuthService
    participant R as UserRepository
    participant J as JwtService

    C->>A: Login ou cadastro
    A->>S: Request validado
    S->>R: Buscar ou salvar usuÃ¡rio
    S->>S: BCrypt ou comparaÃ§Ã£o de senha
    S->>J: Gerar token
    J-->>S: JWT assinado
    S-->>A: AuthResponse
    A-->>C: Dados pÃºblicos e token
```

### Token

```text
subject (sub) = userId
email          = email normalizado
name           = nome do usuÃ¡rio
role           = USER ou ADMIN
issuer         = gitcine-backend
expiration     = 2 horas
```

JWT padrÃ£o:

```yaml
jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:7200000}
  issuer: ${JWT_ISSUER:gitcine-backend}
```

### SeguranÃ§a

- senha criptografada com BCrypt;
- token assinado com segredo vÃ¡lido;
- issuer validado no parser;
- filtro JWT limpa o contexto antes de autenticar;
- requisiÃ§Ã£o protegida usa o `userId` do subject;
- credenciais nunca sÃ£o devolvidas pela resposta;
- cadastro pÃºblico sempre cria `ROLE_USER`;
- role nÃ£o pode ser informada no cadastro pÃºblico;
- campos JSON desconhecidos respondem `400`;
- JWT invÃ¡lido ou expirado responde `401`;
- ausÃªncia de role administrativa responde `403`.

> A expiraÃ§Ã£o padrÃ£o foi reduzida de 24 horas para 2 horas. Sem refresh token, o frontend deve redirecionar o usuÃ¡rio ao login apÃ³s `401`.

---

## ðŸ‘¥ Roles e permissÃµes

O schema preparado usa:

```text
tb_role
â”œâ”€â”€ id
â””â”€â”€ authority

tb_user_role
â”œâ”€â”€ user_id
â””â”€â”€ role_id
```

Autoridades existentes:

- `ROLE_USER`;
- `ROLE_ADMIN`.

Cada usuÃ¡rio deve possuir uma Ãºnica role no modelo atual.

| PermissÃ£o | USER | ADMIN | PÃºblico |
|---|:---:|:---:|:---:|
| Login e cadastro | âœ“ | âœ“ | âœ“ |
| Consultar filmes | âœ“ | âœ“ | âœ“ |
| Avaliar ou atualizar nota | âœ“ | âœ“ | â€” |
| Sugerir filme por email | âœ“ | âœ“ | â€” |
| Cadastrar filme | â€” | âœ“ | â€” |

### ConvencÃµes

| Lugar | Valor |
|---|---|
| Banco: `tb_role.authority` | `ROLE_USER` / `ROLE_ADMIN` |
| Claim do JWT: `role` | `USER` / `ADMIN` |
| Spring Security | `ROLE_USER` / `ROLE_ADMIN` |

### Estado do schema Neon

- `tb_user` contÃ©m `name`, `email` e `password`;
- `password` aceita hashes BCrypt de atÃ© 255 caracteres;
- `tb_role` contÃ©m `ROLE_USER` e `ROLE_ADMIN`;
- `tb_user_role` vincula usuÃ¡rio e role;
- Maria possui `ROLE_ADMIN`;
- os demais usuÃ¡rios possuem `ROLE_USER`;
- as foreign keys de usuÃ¡rios, roles, filmes e avaliaÃ§Ãµes estÃ£o aplicadas;
- resta validar essas estruturas pelo startup real da aplicaÃ§Ã£o.

---

## â­ AvaliaÃ§Ã£o de filmes

```mermaid
sequenceDiagram
    participant C as Cliente
    participant F as JwtFilter
    participant R as RatingController
    participant S as RatingService
    participant P as RatingRepository
    participant M as MovieRepository

    C->>F: Bearer JWT
    F-->>R: userId autenticado
    R->>S: movieId + value
    S->>P: Buscar avaliaÃ§Ã£o existente
    S->>P: Criar ou atualizar rating
    S->>P: Executar AVG e COUNT
    S->>M: Atualizar score e count com lock
    S-->>R: Resultado
    R-->>C: RatingResponse
```

### Regras implementadas no cÃ³digo

- notas vÃ¡lidas entre `1.0` e `5.0`;
- chave composta por `movie_id + user_id`;
- lock pessimista ao carregar o filme;
- mÃ©dia calculada por `AVG(r.value)`;
- quantidade calculada por `COUNT(r)`;
- recÃ¡lculo dentro da transaÃ§Ã£o;
- atualizaÃ§Ã£o da nota mantÃ©m o `count`;
- primeira avaliaÃ§Ã£o adiciona ao `count`;
- `userId` vem do JWT, nÃ£o do body.

> O recÃ¡lculo estÃ¡ implementado, mas nÃ£o estÃ¡ concluÃ­do atÃ© o teste concorrente passar contra PostgreSQL real.

### Endpoint

```http
POST /api/ratings
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "movieId": 1,
  "value": 4.5
}
```

---

## ðŸŽ¬ Funcionalidades atuais

### Filmes

- listagem pÃºblica paginada;
- busca pÃºblica por ID;
- cadastro administrativa;
- tÃ­tulo normalizado;
- URL de imagem validada;
- duplicidade de tÃ­tulo rejeitada;
- `score = 0.0` e `count = 0` em novos filmes.

### AvaliaÃ§Ãµes

- criaÃ§Ã£o ou atualizaÃ§Ã£o;
- chave composta;
- validaÃ§Ã£o de nota;
- recÃ¡lculo agregado;
- lock pessimista do filme;
- proteÃ§Ã£o por JWT.

### Propostas de filme

- endpoint autenticado;
- tÃ­tulo e mensagem;
- envio assÃ­ncrono por SMTP;
- falha de email tratada com log;
- resposta `202 Accepted`.

### AdministraÃ§Ã£o

```http
POST /api/admin/movies
Authorization: Bearer <jwt-admin>
```

Somente usuÃ¡rios com `ROLE_ADMIN` acessam `/api/admin/**`.

---

## ðŸŽ¯ Endpoints REST

| MÃ©todo | Endpoint | Acesso |
|---|---|---|
| POST | `/api/auth/register` | PÃºblico |
| POST | `/api/auth/login` | PÃºblico |
| GET | `/api/movies` | PÃºblico |
| GET | `/api/movies/{id}` | PÃºblico |
| POST | `/api/ratings` | JWT |
| POST | `/api/movie-requests` | JWT |
| POST | `/api/admin/movies` | JWT + ADMIN |
| GET | `/actuator/health` | PÃºblico |
| GET | `/swagger-ui.html` | PÃºblico em desenvolvimento |
| GET | `/v3/api-docs` | PÃºblico em desenvolvimento |

---

## ðŸ—„ï¸ Banco PostgreSQL/Neon

### Estrutura usada

| Entidade JPA | Tabela | Chave |
|---|---|---|
| `UserEntity` | `tb_user` | `id` |
| `RoleEntity` | `tb_role` | `id` |
| `UserEntity.roles` | `tb_user_role` | `user_id + role_id` |
| `MovieEntity` | `tb_movie` | `id` |
| `RatingEntity` | `tb_score` | `movie_id + user_id` |

### DecisÃµes fechadas

- o banco vive no Neon;
- o backend nÃ£o cria tabelas;
- o backend nÃ£o cria schemas;
- o backend nÃ£o executa migrations;
- nÃ£o existe Flyway/Liquibase no projeto;
- `prod` usa `ddl-auto: validate`;
- o banco principal Ã© o Neon;
- testes nÃ£o precisam de banco embarcado;
- alteraÃ§Ãµes estruturais sÃ£o feitas manualmente no Neon;

### Dados jÃ¡ existentes no script

- filmes iniciais;
- usuÃ¡rios iniciais;
- usuÃ¡rios e roles;
- avaliaÃ§Ãµes iniciais;
- foreign keys entre filmes, usuÃ¡rios e avaliaÃ§Ãµes.

---

## âš™ï¸ ConfiguraÃ§Ã£o por ambiente

### Desenvolvimento

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

### Testes

- nÃ£o utilizar banco embarcado;
- unitÃ¡rios: mocks e objetos puros;
- integraÃ§Ã£o: PostgreSQL/Testcontainers;
- seguranÃ§a: MockMvc com Spring Security;
- concorrÃªncia: PostgreSQL real, com lock e agregaÃ§Ã£o;

### ProduÃ§Ã£o

- PostgreSQL/Neon;
- `ddl-auto: validate`;
- Swagger desabilitado;
- JWT com 2 horas;
- secret JWT protegido por ambiente;
- mÃ¡ximo de 50 itens por pÃ¡gina;
- Actuator limitado a `health` e `info`.

### VariÃ¡veis

```dotenv
DB_URL=jdbc:postgresql://host/neondb?sslmode=require
DB_USERNAME=usuario
DB_PASSWORD=senha
JWT_SECRET=secret-longo-e-aleatorio
JWT_EXPIRATION=7200000
JWT_ISSUER=gitcine-backend
APP_PROFILE=prod
CORS_ALLOWED_ORIGINS=https://frontend.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=usuario
SMTP_PASSWORD=senha
```

Nomes, senhas e credenciais reais nÃ£o devem aparecer em cÃ³digo, Markdown, logs ou Git.

---

## ðŸš¨ Tratamento de erros

`GlobalExceptionHandler` padroniza os erros.

| SituaÃ§Ã£o | HTTP |
|---|---:|
| Dados invÃ¡lidos | 400 |
| Credencial ou token invÃ¡lido | 401 |
| Role insuficiente | 403 |
| UsuÃ¡rio ou filme inexistente | 404 |
| Conflito ou duplicidade | 409 |
| Nota fora do intervalo | 422 |
| Erro interno | 500 |

A resposta nÃ£o deve expor stack trace, SQL ou detalhes internos.

---

## ðŸ“š Swagger

O Swagger estÃ¡ configurado com:

- tÃ­tulo e descriÃ§Ã£o da API;
- Bearer JWT;
- security scheme `bearerAuth`;
- tags por domÃ­nio;
- schemas dos DTOs;
- parÃ¢metros de paginaÃ§Ã£o;
- respostas bÃ¡sicas.

URLs em desenvolvimento:

```text
/swagger-ui.html
/v3/api-docs
```

Em produÃ§Ã£o, Swagger e OpenAPI ficam desabilitados.

Ainda falta completar exemplos detalhados de cada resposta HTTP.

---

## âœ… Estado atual

### ConcluÃ­do

- [x] arquitetura hexagonal bÃ¡sica;
- [x] Java 25 e Spring Boot 4.1.2;
- [x] cadastro, login e BCrypt;
- [x] JWT com issuer e 2 horas de expiraÃ§Ã£o;
- [x] filtro JWT;
- [x] role persistida em JPA;
- [x] cadastro pÃºblico fixado em `ROLE_USER`;
- [x] campos JSON desconhecidos rejeitados;
- [x] perfis `dev` e `prod`;
- [x] H2 removido de dependÃªncias e configuraÃ§Ãµes;
- [x] endpoints pÃºblicos de filmes;
- [x] avaliaÃ§Ã£o protegida;
- [x] cadastro administrativo;
- [x] proposta de filme por email;
- [x] lock pessimista do filme;
- [x] agregaÃ§Ã£o SQL de mÃ©dia e quantidade;
- [x] CORS configurÃ¡vel;
- [x] Swagger bÃ¡sico;
- [x] Swagger desabilitado em produÃ§Ã£o;
- [x] Actuator reduzido;
- [x] Flyway removido;
- [x] backend legado removido;
- [x] compilaÃ§Ã£o e testes Maven executados.

### Em validaÃ§Ã£o

- [ ] compatibilidade real das entidades JPA com o schema aplicado;
- [ ] role ADMIN carregada do banco;
- [ ] cadastro e login contra Neon;
- [ ] avaliaÃ§Ã£o contra Neon;
- [ ] atualizaÃ§Ã£o da mesma avaliaÃ§Ã£o;
- [ ] score/count concorrentes;
- [ ] envio real de email;
- [ ] Swagger completo;
- [ ] integraÃ§Ã£o frontend.

### Pendente

- [ ] testes de seguranÃ§a com MockMvc;
- [ ] testes JWT: vÃ¡lido, expirado e adulterado;
- [ ] testes de roles;
- [ ] testes PostgreSQL/Testcontainers;
- [ ] teste concorrente de score/count;
- [ ] testes ArchUnit;
- [ ] pipeline CI/CD;
- [ ] deploy em nuvem.

---

## ðŸ§ª ValidaÃ§Ã£o tÃ©cnica realizada

Comandos executados:

```powershell
.\mvnw -q test
.\mvnw -q -DskipTests compile
```

Testes conhecidos:

- `AuthServiceTest`;
- `RatingDomainServiceTest`;
- `DsmovieApplicationTests`.

A implementaÃ§Ã£o atual ainda nÃ£o possui uma prova automatizada concorrente do score/count nem testes completos de seguranÃ§a JWT.

Os testes unitÃ¡rios executados nÃ£o inicializam banco embarcado. Os testes com Neon/PostgreSQL serÃ£o executados por integraÃ§Ã£o separada.

---

## ðŸš€ PrÃ³ximos passos

1. Configurar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET` no ambiente.
2. Iniciar o backend com `APP_PROFILE=prod`.
3. Validar o schema via `Hibernate validate` durante o startup.
4. Testar login dos usuÃ¡rios existentes no Neon.
5. Confirmar Maria com `ROLE_ADMIN` no JWT.
6. Confirmar os demais usuÃ¡rios com `ROLE_USER` no JWT.
7. Testar cadastro pÃºblico; ele deve atribuir `ROLE_USER` automaticamente.
8. Testar avaliaÃ§Ãµes criadas e atualizadas.
9. Testar concorrÃªncia real de score/count.
10. Testar rotas pÃºblicas, `401` e `403`.
11. Completar MockMvc e Testcontainers.
12. Completar Swagger e exemplos de erro.
13. Integrar frontend, CI e deploy.

---

## ðŸ CritÃ©rio de conclusÃ£o

- [ ] schema compatÃ­vel com as entidades JPA;
- [ ] cadastro funcionando;
- [ ] login funcionando;
- [ ] senha persistida com BCrypt;
- [ ] uma Ãºnica role por usuÃ¡rio;
- [ ] Maria com `ROLE_ADMIN`;
- [ ] demais usuÃ¡rios com `ROLE_USER`;
- [ ] JWT vÃ¡lido autenticado;
- [ ] JWT expirado ou adulterado retorna `401`;
- [ ] usuÃ¡rio sem role administrativa recebe `403`;
- [ ] avaliaÃ§Ã£o sem token Ã© bloqueada;
- [ ] avaliaÃ§Ã£o cria ou atualiza corretamente;
- [ ] nÃ£o existe duplicidade por usuÃ¡rio e filme;
- [ ] score corresponde Ã  mÃ©dia real;
- [ ] count corresponde ao total real;
- [ ] teste concorrente passa em PostgreSQL;
- [ ] admin cadastra filme;
- [ ] usuÃ¡rio envia proposta;
- [ ] credenciais sÃ£o gerenciadas por ambiente ou secrets;
- [ ] Swagger estÃ¡ disponÃ­vel somente onde configurado;
- [ ] testes passam;
- [ ] frontend integrado;
- [ ] CI/CD configurado;
- [ ] deploy concluÃ­do.