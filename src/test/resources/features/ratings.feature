Feature: Avaliações de filmes
  Como usuário autenticado
  Quero avaliar um filme e atualizar minha nota

  Scenario: Criar primeira avaliação
    Given existe um usuário autenticado com ID 7
    And existe o filme 1 para avaliação
    When o usuário avalia o filme 1 com nota 4.5
    Then a avaliação deve ser registrada com nota 4.5
    And o filme deve ter média 4.5 e quantidade 1

  Scenario: Atualizar avaliação existente
    Given existe um usuário autenticado com ID 7
    And existe o filme 1 para avaliação
    And o usuário já avaliou o filme 1 com nota 2.0
    When o usuário avalia o filme 1 com nota 5.0
    Then a avaliação deve ser registrada com nota 5.0

  Scenario: Rejeitar nota fora do intervalo
    Given existe um usuário autenticado com ID 7
    And existe o filme 1 para avaliação
    When o usuário avalia o filme 1 com nota 6.0
    Then deve ocorrer uma falha de nota inválida

