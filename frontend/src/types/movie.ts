export type Movie = {
    id: number;
    title: string;
    score: number;
    count: number;
    image: string;
    synopsis?: string | null;
}

// Formato usado pelos componentes (Pagination/Listing).
export type MoviePage = {
    content: Movie[];
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

// Formato real devolvido pelo backend em GET /api/movies (MovieListResponse).
export type MovieListResponse = {
    content: Movie[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// POST /api/admin/movies (CreateMovieRequest)
export type CreateMovieRequest = {
    title: string;
    image: string;
}

// POST /api/movie-requests (MovieProposalRequest)
export type MovieProposalRequest = {
    title: string;
    message?: string;
}

// Resposta de POST /api/ratings (RatingResponse)
export type RatingResponse = {
    movieId: number;
    userId: number;
    value: number;
    movieScore: number;
    movieCount: number;
}

// State enviado ao abrir a tela de avaliação (/movies/:movieId/rate).
// O catálogo envia `movie`; o perfil envia também a nota atual e para onde voltar depois de salvar.
export type RateMovieState = {
    movie?: Pick<Movie, 'title' | 'image'>;
    currentRating?: number;
    returnTo?: string;
}
