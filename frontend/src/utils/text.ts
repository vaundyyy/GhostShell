// Texto para comparação: sem acentos, minúsculo e sem espaços nas pontas ("Ação " → "acao").
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
