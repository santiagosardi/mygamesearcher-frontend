import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { obtenerJuegos } from '../../services/juegos.service'
import type { Juego } from '../../types/juego'

function CatalogPage() {
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const textoBuscado = busqueda.trim().toLowerCase()
  const juegosFiltrados = juegos.filter((juego) =>
    juego.titulo.toLowerCase().includes(textoBuscado),
  )

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
      <div className="row mb-4">
        <div className="col-12 col-md-8 col-lg-6">
          <label className="form-label" htmlFor="busqueda-catalogo">Buscar por título</label>
          <input
            className="form-control catalog-search"
            id="busqueda-catalogo"
            type="search"
            placeholder="Escribí el título de un juego"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </div>
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando juegos…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : juegos.length === 0 ? (
        <section className="placeholder-panel p-4">
          <h2 className="h4">Todavía no hay juegos en el catálogo</h2>
          <p className="secondary-text mb-0">Los juegos aparecerán acá cuando estén disponibles.</p>
        </section>
      ) : juegosFiltrados.length === 0 ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">
          No se encontraron juegos con esa búsqueda
        </p>
      ) : (
        <div className="row g-3">
          {juegosFiltrados.map((juego) => (
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
