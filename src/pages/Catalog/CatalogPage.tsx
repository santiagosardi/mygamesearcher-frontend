import { useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { obtenerJuegos } from '../../services/juegos.service'
import type { Juego } from '../../types/juego'

function CatalogPage() {
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [generoSeleccionado, setGeneroSeleccionado] = useState('')
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState('')

  const generosDisponibles = Array.from(
    new Map(juegos.flatMap((juego) => juego.generos).map((genero) => [genero.id, genero])).values(),
  ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const plataformasDisponibles = Array.from(
    new Map(juegos.flatMap((juego) => juego.plataformas).map((plataforma) => [plataforma.id, plataforma])).values(),
  ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const textoBuscado = busqueda.trim().toLowerCase()
  const juegosFiltrados = juegos.filter((juego) =>
    juego.titulo.toLowerCase().includes(textoBuscado) &&
    (generoSeleccionado === '' || juego.generos.some((genero) => genero.id === Number(generoSeleccionado))) &&
    (plataformaSeleccionada === '' || juego.plataformas.some((plataforma) => plataforma.id === Number(plataformaSeleccionada))),
  )

  function limpiarFiltros() {
    setBusqueda('')
    setGeneroSeleccionado('')
    setPlataformaSeleccionada('')
  }

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
      <div className="row g-3 mb-4 align-items-end">
        <div className="col-12 col-lg-4">
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
        <div className="col-12 col-md-6 col-lg-3">
          <label className="form-label" htmlFor="genero-catalogo">Género</label>
          <select
            className="form-select catalog-search"
            id="genero-catalogo"
            data-bs-theme="dark"
            value={generoSeleccionado}
            onChange={(event) => setGeneroSeleccionado(event.target.value)}
          >
            <option value="">Todos</option>
            {generosDisponibles.map((genero) => (
              <option value={genero.id} key={genero.id}>{genero.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <label className="form-label" htmlFor="plataforma-catalogo">Plataforma</label>
          <select
            className="form-select catalog-search"
            id="plataforma-catalogo"
            data-bs-theme="dark"
            value={plataformaSeleccionada}
            onChange={(event) => setPlataformaSeleccionada(event.target.value)}
          >
            <option value="">Todos</option>
            {plataformasDisponibles.map((plataforma) => (
              <option value={plataforma.id} key={plataforma.id}>{plataforma.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-lg-2">
          <button className="btn btn-outline-secondary w-100" type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
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
          No se encontraron juegos con los filtros seleccionados
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
