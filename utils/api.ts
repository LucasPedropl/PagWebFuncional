
export const API_BASE_URL = "https://lojas.vlks.com.br";

/**
 * Retorna a URL completa para uma imagem vinda da API
 * @param path Caminho relativo da imagem
 * @returns URL absoluta ou string vazia
 */
export const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
