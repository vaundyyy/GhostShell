Feature: Proposta de novos filmes
  Como usuário autenticado
  Quero solicitar o cadastro de um filme

  Scenario: Usuário envia proposta válida
    Given existe um usuário autenticado com ID 7
    When o usuário envia a proposta "Oppenheimer" com mensagem "Ainda não está no catálogo"
    Then a proposta deve ser enviada ao administrador

  Scenario: Usuário inexistente não envia proposta
    Given não existe o usuário autenticado com ID 99
    When o usuário envia a proposta "Filme" com mensagem "Sugestão"
    Then deve ocorrer uma falha de usuário não encontrado

