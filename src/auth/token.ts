const TOKEN_KEY = 'mygamesearcher_access_token'

export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function eliminarToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
