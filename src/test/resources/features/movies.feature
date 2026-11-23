Feature: Catálogo de filmes
  Como visitante ou usuário autenticado
  Quero consultar filmes e administradores podem cadastrar novos títulos

  Scenario: Consultar filme por ID
    Given existe o filme 1 com título "The Witcher" score 4.5 e count 2
    When eu consulto o filme pelo ID 1
    Then o resultado deve ter o título "The Witcher"

  Scenario: Listar filmes paginados
    Given existe o filme 1 com título "The Witcher" score 4.5 e count 2
    And existe o filme 2 com título "Venom" score 3.3 e count 3
    When eu listo a página 0 com tamanho 12
    Then a resposta deve ter 2 filmes

  Scenario: Administrador cria um filme
    Given o administrador está autenticado
    When eu cadastro o filme "Interestelar" com imagem "https://example.com/interestelar.jpg"
    Then o filme criado deve ter o título "Interestelar"

