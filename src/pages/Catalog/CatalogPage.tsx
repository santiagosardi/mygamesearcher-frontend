import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { obtenerJuegos } from '../../services/juegos.service'
import type { Juego } from '../../types/juego'

function CatalogPage() {
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarJuegos() {
      try {
        const datos = await obtenerJuegos()
        if (activo) setJuegos(datos)
      } catch {
        if (activo) {
          setError('No pudimos cargar el catálogo. Verificá que el backend esté disponible e intentá volver a esta página más tarde.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarJuegos()

    // Ignora el resultado de esta consulta si se abandona la pantalla.
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <PageHeader title="Catálogo" description="Explorá videojuegos para descubrir cuáles querés sumar a tu biblioteca." />
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando juegos…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : juegos.length === 0 ? (
        <section className="placeholder-panel p-4">
          <h2 className="h4">Todavía no hay juegos en el catálogo</h2>
          <p className="secondary-text mb-0">Los juegos aparecerán acá cuando estén disponibles.</p>
        </section>
      ) : (
        <div className="row g-3">
          {juegos.map((juego) => (
            <div className="col-12 col-md-6 col-xl-4" key={juego.id}>
              <article className="placeholder-panel h-100 p-4 text-break">
                <h2 className="h4">{juego.titulo}</h2>
                <p className="secondary-text">{juego.descripcion?.trim() || 'Sin descripción disponible.'}</p>
                <dl className="mb-0">
                  <dt>Desarrollador</dt>
                  <dd className="secondary-text">{juego.desarrollador?.trim() || 'No informado'}</dd>
                  <dt>Géneros</dt>
                  <dd className="secondary-text">{juego.generos.map((genero) => genero.nombre).join(', ') || 'No informados'}</dd>
                  <dt>Plataformas</dt>
                  <dd className="secondary-text mb-0">{juego.plataformas.map((plataforma) => plataforma.nombre).join(', ') || 'No informadas'}</dd>
                </dl>
              </article>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
export default CatalogPage
