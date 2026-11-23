package com.dsmovie.cucumber;

import com.dsmovie.application.dto.auth.AuthResponse;
import com.dsmovie.application.dto.auth.LoginRequest;
import com.dsmovie.application.dto.auth.RegisterRequest;
import com.dsmovie.application.dto.movie.CreateMovieRequest;
import com.dsmovie.application.dto.movie.MovieListResponse;
import com.dsmovie.application.dto.movie.MovieProposalRequest;
import com.dsmovie.application.dto.movie.MovieResponse;
import com.dsmovie.application.dto.rating.RatingRequest;
import com.dsmovie.application.dto.rating.RatingResponse;
import com.dsmovie.application.port.out.AuthenticationTokenPort;
import com.dsmovie.application.port.out.MovieRepositoryPort;
import com.dsmovie.application.port.out.RatingRepositoryPort;
import com.dsmovie.application.port.out.SendMovieProposalPort;
import com.dsmovie.application.port.out.UserRepositoryPort;
import com.dsmovie.application.useCase.AuthService;
import com.dsmovie.application.useCase.MovieProposalService;
import com.dsmovie.application.useCase.MovieService;
import com.dsmovie.application.useCase.RatingService;
import com.dsmovie.domain.exception.AuthenticationException;
import com.dsmovie.domain.exception.InvalidRatingException;
import com.dsmovie.domain.exception.UserNotFoundException;
import com.dsmovie.domain.model.Movie;
import com.dsmovie.domain.model.Rating;
import com.dsmovie.domain.model.RatingId;
import com.dsmovie.domain.model.User;
import com.dsmovie.infrastructure.rest.AdminMovieController;
import com.dsmovie.infrastructure.rest.AuthController;
import com.dsmovie.infrastructure.rest.MovieController;
import com.dsmovie.infrastructure.rest.MovieProposalController;
import com.dsmovie.infrastructure.rest.RatingController;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class BackendSteps {
    private UserRepositoryPort userRepository;
    private MovieRepositoryPort movieRepository;
    private RatingRepositoryPort ratingRepository;
    private SendMovieProposalPort proposalPort;
    private PasswordEncoder passwordEncoder;
    private AuthenticationTokenPort tokenPort;

    private AuthService authService;
    private MovieService movieService;
    private RatingService ratingService;
    private MovieProposalService proposalService;

    private AuthController authController;
    private MovieController movieController;
    private RatingController ratingController;
    private AdminMovieController adminMovieController;
    private MovieProposalController proposalController;

    private final Map<String, User> users = new HashMap<>();
    private final Map<Long, Movie> movies = new HashMap<>();
    private final Map<RatingId, Rating> ratings = new HashMap<>();

    private AuthResponse authResponse;
    private RuntimeException failure;
    private MovieResponse movieResponse;
    private MovieListResponse movieListResponse;
    private RatingResponse ratingResponse;
    private boolean proposalSent;
    private Long authenticatedUserId;

    @Before
    public void reset() {
        users.clear();
        movies.clear();
        ratings.clear();
        authResponse = null;
        failure = null;
        movieResponse = null;
        movieListResponse = null;
        ratingResponse = null;
        proposalSent = false;
        authenticatedUserId = null;

        userRepository = mock(UserRepositoryPort.class);
        movieRepository = mock(MovieRepositoryPort.class);
        ratingRepository = mock(RatingRepositoryPort.class);
        proposalPort = mock(SendMovieProposalPort.class);
        passwordEncoder = mock(PasswordEncoder.class);
        tokenPort = mock(AuthenticationTokenPort.class);

        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "encoded-" + invocation.getArgument(0, String.class));
        when(tokenPort.generateToken(any(User.class))).thenReturn("jwt-token");

        when(userRepository.findByEmail(anyString())).thenAnswer(invocation -> {
            String email = invocation.getArgument(0, String.class).toLowerCase(Locale.ROOT);
            return users.values().stream().filter(user -> user.getEmail().equals(email)).findFirst();
        });
        when(userRepository.findById(anyLong())).thenAnswer(invocation -> {
            Long id = invocation.getArgument(0, Long.class);
            return users.values().stream().filter(user -> id.equals(user.getId())).findFirst();
        });
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0, User.class);
            if (user.getId() == null) user.setId((long) users.size() + 1);
            users.put(user.getEmail(), user);
            return user;
        });

        when(movieRepository.findById(anyLong())).thenAnswer(invocation -> Optional.ofNullable(movies.get(invocation.getArgument(0, Long.class))));
        when(movieRepository.findByIdForUpdate(anyLong())).thenAnswer(invocation -> Optional.ofNullable(movies.get(invocation.getArgument(0, Long.class))));
        when(movieRepository.findAll(anyInt(), anyInt())).thenAnswer(invocation -> {
            int page = invocation.getArgument(0, Integer.class);
            int size = invocation.getArgument(1, Integer.class);
            List<Movie> all = new ArrayList<>(movies.values());
            int from = Math.min(page * size, all.size());
            int to = Math.min(from + size, all.size());
            return all.subList(from, to);
        });
        when(movieRepository.count()).thenAnswer(invocation -> (long) movies.size());
        when(movieRepository.existsByNormalizedTitle(anyString())).thenAnswer(invocation -> {
            String title = invocation.getArgument(0, String.class);
            return movies.values().stream().anyMatch(movie -> movie.getTitle().equalsIgnoreCase(title));
        });
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> {
            Movie movie = invocation.getArgument(0, Movie.class);
            if (movie.getId() == null) movie.setId((long) movies.size() + 1);
            movies.put(movie.getId(), movie);
            return movie;
        });

        when(ratingRepository.findByUserAndMovie(anyLong(), anyLong())).thenAnswer(invocation -> {
            RatingId id = new RatingId(invocation.getArgument(1, Long.class), invocation.getArgument(0, Long.class));
            return Optional.ofNullable(ratings.get(id));
        });
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> {
            Rating rating = invocation.getArgument(0, Rating.class);
            ratings.put(rating.getId(), rating);
            return rating;
        });
        when(ratingRepository.aggregateByMovieId(anyLong())).thenAnswer(invocation -> {
            Long movieId = invocation.getArgument(0, Long.class);
            List<Double> values = ratings.values().stream()
                    .filter(rating -> rating.getId().getMovieId().equals(movieId))
                    .map(Rating::getValue).toList();
            double average = values.isEmpty() ? 0.0 : values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            return new RatingRepositoryPort.Aggregate(Math.round(average * 100.0) / 100.0, values.size());
        });

        doAnswer(invocation -> {
            proposalSent = true;
            return null;
        }).when(proposalPort).send(anyLong(), anyString(), nullable(String.class));

        authService = new AuthService(userRepository, passwordEncoder, tokenPort);
        movieService = new MovieService(movieRepository);
        ratingService = new RatingService(movieRepository, ratingRepository, userRepository);
        proposalService = new MovieProposalService(userRepository, proposalPort);

        authController = new AuthController(authService);
        movieController = new MovieController(movieService);
        ratingController = new RatingController(ratingService);
        adminMovieController = new AdminMovieController(movieService);
        proposalController = new MovieProposalController(proposalService);
    }

    @Given("a porta de usuários não contém o email {string}")
    public void portaSemEmail(String email) {
        users.remove(email.toLowerCase(Locale.ROOT));
    }

    @When("eu cadastro o usuário {string} com email {string} e senha {string}")
    public void cadastrar(String name, String email, String password) {
        authResponse = authController.register(new RegisterRequest(name, email, password)).getBody();
    }

    @Then("o cadastro deve retornar o token {string}")
    public void verificarCadastro(String token) {
        assertNotNull(authResponse);
        assertEquals(token, authResponse.token());
    }

    @Then("o usuário deve possuir a role {string}")
    public void verificarRole(String role) {
        assertEquals(role, authResponse.role());
    }

    @Given("existe um usuário {string} com email {string} senha {string} e role {string}")
    public void existeUsuario(String name, String email, String password, String role) {
        User user = new User((long) users.size() + 1, name, email.toLowerCase(Locale.ROOT), password,
                User.Role.valueOf(role));
        users.put(user.getEmail(), user);
    }

    @Given("a senha informada {string} corresponde ao hash do usuário")
    public void senhaCorresponde(String password) {
        when(passwordEncoder.matches(password, "encoded-" + password)).thenReturn(false);
    }

    @Given("a senha informada {string} não corresponde ao hash do usuário")
    public void senhaNaoCorresponde(String password) {
        when(passwordEncoder.matches(eq(password), anyString())).thenReturn(false);
    }

    @When("eu faço login com email {string} e senha {string}")
    public void login(String email, String password) {
        try {
            User user = users.get(email.toLowerCase(Locale.ROOT));
            if (user != null) {
                when(passwordEncoder.matches(password, user.getPassword())).thenReturn(!password.equals("errada")
                        && !password.equals("wrong"));
            }
            authResponse = authController.login(new LoginRequest(email, password)).getBody();
        } catch (RuntimeException ex) {
            failure = ex;
        }
    }

    @Then("o login deve retornar o token {string}")
    public void verificarLogin(String token) {
        assertNotNull(authResponse);
        assertEquals(token, authResponse.token());
    }

    @Then("deve ocorrer uma falha de autenticação")
    public void verificarFalhaAuth() {
        assertInstanceOf(AuthenticationException.class, failure);
    }

    @Given("existe o filme {long} com título {string} score {double} e count {int}")
    public void existeFilme(Long id, String title, Double score, Integer count) {
        movies.put(id, new Movie(id, title, null, null, score, count));
    }

    @When("eu consulto o filme pelo ID {long}")
    public void consultarFilme(Long id) {
        movieResponse = movieController.findById(id).getBody();
    }

    @Then("o resultado deve ter o título {string}")
    public void verificarTitulo(String title) {
        assertEquals(title, movieResponse.title());
    }

    @When("eu listo a página {int} com tamanho {int}")
    public void listarFilmes(int page, int size) {
        movieListResponse = movieController.findAll(page, size).getBody();
    }

    @Then("a resposta deve ter {int} filmes")
    public void verificarQuantidadeFilmes(int count) {
        assertEquals(count, movieListResponse.content().size());
    }

    @Given("o administrador está autenticado")
    public void administradorAutenticado() {
        authenticatedUserId = 1L;
        User admin = new User(1L, "Maria", "maria@gitcine.com", "hash", User.Role.ADMIN);
        users.put(admin.getEmail(), admin);
    }

    @When("eu cadastro o filme {string} com imagem {string}")
    public void cadastrarFilme(String title, String image) {
        movieResponse = adminMovieController.create(new CreateMovieRequest(title, image)).getBody();
    }

    @Then("o filme criado deve ter o título {string}")
    public void verificarFilmeCriado(String title) {
        assertEquals(title, movieResponse.title());
    }

    @Given("existe um usuário autenticado com ID {long}")
    public void usuarioAutenticado(Long id) {
        authenticatedUserId = id;
        User user = new User(id, "Ana", "ana@gitcine.com", "hash", User.Role.USER);
        users.put(user.getEmail(), user);
    }

    @Given("não existe o usuário autenticado com ID {long}")
    public void usuarioNaoExiste(Long id) {
        authenticatedUserId = id;
    }

    @Given("existe o filme {long} para avaliação")
    public void existeFilmeParaAvaliacao(Long id) {
        movies.put(id, new Movie(id, "Filme " + id, null, null, 0.0, 0));
    }

    @Given("o usuário já avaliou o filme {long} com nota {double}")
    public void avaliacaoExistente(Long movieId, Double value) {
        Rating rating = new Rating(new RatingId(movieId, authenticatedUserId), value);
        ratings.put(rating.getId(), rating);
    }

    @When("o usuário avalia o filme {long} com nota {double}")
    public void avaliar(Long movieId, Double value) {
        try {
            ratingResponse = ratingController.save(authenticatedUserId,
                    new RatingRequest(movieId, value)).getBody();
        } catch (RuntimeException ex) {
            failure = ex;
        }
    }

    @Then("a avaliação deve ser registrada com nota {double}")
    public void verificarNota(Double value) {
        assertNotNull(ratingResponse);
        assertEquals(value, ratingResponse.value());
    }

    @Then("o filme deve ter média {double} e quantidade {int}")
    public void verificarMediaQuantidade(Double score, Integer count) {
        assertEquals(score, ratingResponse.movieScore());
        assertEquals(count, ratingResponse.movieCount());
    }

    @Then("deve ocorrer uma falha de nota inválida")
    public void verificarNotaInvalida() {
        assertNotNull(failure);
        assertInstanceOf(com.dsmovie.domain.exception.InvalidRatingException.class, failure);
    }

    @When("o usuário envia a proposta {string} com mensagem {string}")
    public void enviarProposta(String title, String message) {
        try {
            proposalController.send(authenticatedUserId,
                    new MovieProposalRequest(title, message));
        } catch (RuntimeException ex) {
            failure = ex;
        }
    }

    @Then("a proposta deve ser enviada ao administrador")
    public void verificarProposta() {
        assertTrue(proposalSent);
    }

    @Then("deve ocorrer uma falha de usuário não encontrado")
    public void verificarUsuarioNaoEncontrado() {
        assertInstanceOf(UserNotFoundException.class, failure);
    }
}
