import { isAxiosError } from 'axios'

export function errorAdmin(error: unknown): string {
  if (!isAxiosError(error)) return 'No pudimos completar la operación. Intentá nuevamente.'
  if (!error.response) return 'No pudimos conectar con el servidor. Verificá la conexión.'
  switch (error.response.status) {
    case 400: return 'El servidor rechazó los datos. Revisá los campos y las opciones seleccionadas.'
    case 401: return 'Tu sesión venció o no es válida. Cerrá sesión e ingresá nuevamente.'
    case 403: return 'Tu cuenta no tiene permiso para realizar esta operación.'
    case 404: return 'El juego o alguno de sus atributos ya no está disponible. Volvé a cargar la página.'
    case 409: return 'Existe un conflicto o una restricción con los datos relacionados. No se completó la operación.'
    default: return 'El servidor no pudo completar la operación. Puede haber una restricción con datos relacionados. Intentá nuevamente.'
  }
}
