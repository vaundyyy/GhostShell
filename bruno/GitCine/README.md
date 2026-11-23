# GitCine — Collection Bruno

## Uso

1. Abra esta pasta no Bruno como uma collection.
2. Selecione o ambiente `Local`.
3. Confirme que o backend está iniciado em `http://localhost:8080`.
4. Execute `auth/Login` ou `auth/Register`.
5. O script pós-resposta salva o JWT em `jwt`.
6. Para testar como administrador, execute o login da Maria e o script pode salvar o token em `adminJwt` manualmente ou copie o retorno para `adminJwt`.

## Fluxo recomendado

1. `auth/Register` ou `auth/Login`
2. `movies/List Movies`
3. `movies/Get Movie by ID`
4. `ratings/Save Rating`
5. `proposals/Send Movie Proposal`

Para cadastrar filmes, execute o login de Maria com `ROLE_ADMIN` e use `admin/Admin - Create Movie`.

## Variáveis

- `baseUrl`: URL do backend
- `jwt`: JWT de usuário comum
- `adminJwt`: JWT de administrador

