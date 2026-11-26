import { fireEvent, render, screen } from '@testing-library/react';
import MoviePoster from '.';

describe('MoviePoster (imagem inteira e centralizada)', () => {
  it('mostra a imagem inteira, centralizada, com o título como texto alternativo', () => {
    render(<MoviePoster src="https://img/duna.jpg" title="Duna" />);
    const image = screen.getByRole('img', { name: 'Duna' });
    expect(image).toHaveAttribute('src', 'https://img/duna.jpg');
    expect(image).toHaveClass('gitcine-poster-image');
  });

  it('preenche as sobras com a própria imagem desfocada, sem repetir para leitores de tela', () => {
    render(<MoviePoster src="https://img/duna.jpg" title="Duna" />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    const backdrop = screen.getByRole('img', { name: '', hidden: true });
    expect(backdrop).toHaveAttribute('src', 'https://img/duna.jpg');
    expect(backdrop).toHaveClass('gitcine-poster-backdrop');
  });

  it('sem URL, mostra a capa neutra com a inicial do título', () => {
    render(<MoviePoster src="" title="duna" />);
    const cover = screen.getByRole('img', { name: 'duna' });
    expect(cover).toHaveClass('gitcine-poster-placeholder');
    expect(cover).toHaveTextContent('D');
  });

  it('troca imagem quebrada pela capa neutra e tenta de novo quando a URL muda', () => {
    const { rerender } = render(<MoviePoster src="https://example.com/quebrada.jpg" title="Duna" />);
    fireEvent.error(screen.getByAltText('Duna'));
    expect(screen.queryByAltText('Duna')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Duna' })).toHaveClass('gitcine-poster-placeholder');

    rerender(<MoviePoster src="https://img/duna.jpg" title="Duna" />);
    expect(screen.getByAltText('Duna')).toHaveAttribute('src', 'https://img/duna.jpg');
  });

  it('repassa a classe de tamanho de quem usa o componente', () => {
    render(<MoviePoster src="" title="Duna" className="gitcine-recent-image" />);
    expect(screen.getByRole('img', { name: 'Duna' })).toHaveClass('gitcine-poster', 'gitcine-recent-image');
  });
});
