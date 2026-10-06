import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { obtenerBiblioteca } from '../../services/bibliotecas.service'
import type { Biblioteca, EstadoBiblioteca } from '../../types/biblioteca'

// Usuario de prueba hasta contar con autenticación.
const USUARIO_PRUEBA_ID = 2

const etiquetasEstado: Record<EstadoBiblioteca, string> = {
  PENDIENTE: 'Pendiente',
  JUGANDO: 'Jugando',
  COMPLETADO: 'Completado',
  ABANDONADO: 'Abandonado',
}

function formatearFecha(valor: string): string {
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? 'Fecha no disponible'
    : fecha.toLocaleDateString('es-AR')
}

function LibraryPage() {
  const [biblioteca, setBiblioteca] = useState<Biblioteca[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarBiblioteca() {
      try {
        const datos = await obtenerBiblioteca(USUARIO_PRUEBA_ID)
        if (activo) setBiblioteca(datos)
      } catch {
        if (activo) {
          setError('No pudimos cargar tu biblioteca. Verificá que el backend esté disponible e intentá volver a esta página más tarde.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarBiblioteca()

    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <PageHeader title="Mi biblioteca" description="Tu espacio personal para reunir videojuegos y organizar lo que querés jugar." />
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando biblioteca…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : biblioteca.length === 0 ? (
        <section className="placeholder-panel p-4">
          <h2 className="h4">Tu biblioteca está vacía</h2>
          <p className="secondary-text mb-0">Los juegos guardados aparecerán acá cuando estén disponibles.</p>
        </section>
      ) : (
        <div className="row g-3">
          {biblioteca.map((entrada) => (
            <div className="col-12 col-md-6 col-xl-4" key={entrada.id}>
              <article className="placeholder-panel h-100 p-4 text-break">
                <h2 className="h4">{entrada.juego.titulo}</h2>
                <p className="secondary-text">{entrada.juego.descripcion?.trim() || 'Sin descripción disponible.'}</p>
                <dl className="mb-0">
                  <dt>Estado</dt>
                  <dd className="secondary-text">{etiquetasEstado[entrada.estado]}</dd>
                  <dt>Favorito</dt>
                  <dd className="secondary-text">{entrada.favorito ? 'Sí' : 'No'}</dd>
                  <dt>Fecha de agregado</dt>
                  <dd className="secondary-text mb-0">{formatearFecha(entrada.fechaAgregado)}</dd>
                </dl>
              </article>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
export default LibraryPage
