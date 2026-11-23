Feature: Autenticação e cadastro
  Como usuário da API GitCine
  Quero cadastrar e autenticar minha conta
  Para acessar recursos protegidos

  Scenario: Cadastro válido cria usuário comum
    Given a porta de usuários não contém o email "bruno@gitcine.com"
    When eu cadastro o usuário "Bruno" com email "bruno@gitcine.com" e senha "senha123"
    Then o cadastro deve retornar o token "jwt-token"
    And o usuário deve possuir a role "USER"

  Scenario: Login com credenciais válidas
    Given existe um usuário "João" com email "joao@gitcine.com" senha "encoded-joao" e role "USER"
    And a senha informada "senha123" corresponde ao hash do usuário
    When eu faço login com email "joao@gitcine.com" e senha "senha123"
    Then o login deve retornar o token "jwt-token"

  Scenario: Login com senha inválida
    Given existe um usuário "João" com email "joao@gitcine.com" senha "encoded-joao" e role "USER"
    And a senha informada "errada" não corresponde ao hash do usuário
    When eu faço login com email "joao@gitcine.com" e senha "errada"
    Then deve ocorrer uma falha de autenticação

