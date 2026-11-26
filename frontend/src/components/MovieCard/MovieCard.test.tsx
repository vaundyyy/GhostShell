import { fireEvent, screen } from '@testing-library/react';
import MovieCard from '.';
import { renderWithProviders } from 'test-utils';
import { Movie } from 'types/movie';

const movie: Movie = { id: 30, title: 'Meu Malvado Favorito', image: 'https://img/malvado.jpg', score: 0, count: 0 };

describe('MovieCard (catálogo)', () => {
  it('mostra a imagem do filme inteira e centralizada', () => {
    renderWithProviders(<MovieCard movie={movie} />);
    const image = screen.getByRole('img', { name: 'Meu Malvado Favorito' });
    expect(image).toHaveAttribute('src', movie.image);
    expect(image).toHaveClass('gitcine-poster-image');
  });

  it('troca imagem quebrada por uma capa neutra no catálogo', () => {
    renderWithProviders(<MovieCard movie={{ ...movie, image: 'https://example.com/quebrada.jpg' }} />);
    fireEvent.error(screen.getByAltText('Meu Malvado Favorito'));
    expect(screen.getByRole('img', { name: 'Meu Malvado Favorito' })).toHaveClass('gitcine-poster-placeholder');
  });

  it('o botão leva para a avaliação do filme', () => {
    renderWithProviders(<MovieCard movie={movie} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movies/30/rate');
  });
});
