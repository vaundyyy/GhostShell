import { useState } from 'react';
import './styles.css';

type Props = {
  src?: string;
  title: string;
  className?: string; // tamanho/forma definidos por quem usa (card, faixa, miniatura...)
};

// Mostra a imagem do filme INTEIRA e centralizada, na proporção dela (pôster vertical ou foto horizontal).
// O espaço que sobra no quadro é preenchido pela própria imagem desfocada.
// Sem URL, ou se a URL falhar ao carregar, mostra uma capa neutra com a inicial do título.
function MoviePoster({ src, title, className = '' }: Props) {
  // Guarda qual URL falhou: quando a URL muda (ex.: foto atual do catálogo), tenta de novo.
  const [failedSrc, setFailedSrc] = useState<string>();
  const classes = `gitcine-poster ${className}`.trim();

  if (!src || failedSrc === src) {
    return (
      <div className={`${classes} gitcine-poster-placeholder`} role="img" aria-label={title}>
        {title.trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={classes}>
      <img src={src} alt="" aria-hidden="true" className="gitcine-poster-backdrop" />
      <img src={src} alt={title} className="gitcine-poster-image" onError={() => setFailedSrc(src)} />
    </div>
  );
}

export default MoviePoster;
