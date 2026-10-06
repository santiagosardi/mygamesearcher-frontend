import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import PageHeader from '../../components/PageHeader'
import { obtenerJuegos } from '../../services/juegos.service'
import { agregarJuegoABiblioteca, obtenerBiblioteca } from '../../services/bibliotecas.service'
import type { Juego } from '../../types/juego'

// Usuario de prueba hasta contar con autenticación.
const USUARIO_PRUEBA_ID = 2

function CatalogPage() {
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [generoSeleccionado, setGeneroSeleccionado] = useState('')
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState('')
  const [juegosGuardados, setJuegosGuardados] = useState<number[]>([])
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(true)
  const [errorBiblioteca, setErrorBiblioteca] = useState<string | null>(null)
  const [agregando, setAgregando] = useState<number[]>([])
  const [mensajes, setMensajes] = useState<Record<number, { texto: string; error: boolean }>>({})
  const solicitudesEnCurso = useRef(new Set<number>())
  const montado = useRef(false)

  async function agregarJuego(juegoId: number) {
    if (cargandoBiblioteca || errorBiblioteca || juegosGuardados.includes(juegoId) || solicitudesEnCurso.current.has(juegoId)) return

    // Bloquea inmediatamente otro envío, incluso antes del siguiente render.
    solicitudesEnCurso.current.add(juegoId)
    setAgregando((actuales) => [...actuales, juegoId])
    setMensajes((actuales) => {
      const siguientes = { ...actuales }
      delete siguientes[juegoId]
      return siguientes
    })

    try {
      await agregarJuegoABiblioteca({ usuarioId: USUARIO_PRUEBA_ID, juegoId })
      if (!montado.current) return
      setJuegosGuardados((actuales) => [...new Set([...actuales, juegoId])])
      setMensajes((actuales) => ({ ...actuales, [juegoId]: { texto: 'Juego agregado a tu biblioteca.', error: false } }))
    } catch (error) {
      if (!montado.current) return
      if (isAxiosError(error) && error.response?.status === 409) {
        setJuegosGuardados((actuales) => [...new Set([...actuales, juegoId])])
        setMensajes((actuales) => ({ ...actuales, [juegoId]: { texto: 'Este juego ya estaba en tu biblioteca.', error: false } }))
      } else {
        const texto = isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Verificá la conexión e intentá nuevamente.'
          : 'No pudimos agregar el juego. Intentá nuevamente.'
        setMensajes((actuales) => ({ ...actuales, [juegoId]: { texto, error: true } }))
      }
    } finally {
      solicitudesEnCurso.current.delete(juegoId)
      if (montado.current) setAgregando((actuales) => actuales.filter((id) => id !== juegoId))
    }
  }

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
  const juegosOrdenados = [...juegosFiltrados].sort((a, b) => {
    const diferenciaBiblioteca = Number(juegosGuardados.includes(a.id)) - Number(juegosGuardados.includes(b.id))
    return diferenciaBiblioteca || a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' })
  })

  function limpiarFiltros() {
    setBusqueda('')
    setGeneroSeleccionado('')
    setPlataformaSeleccionada('')
  }

  useEffect(() => {
    let activo = true
    montado.current = true

    async function cargarBiblioteca() {
      try {
        const entradas = await obtenerBiblioteca(USUARIO_PRUEBA_ID)
        if (activo) setJuegosGuardados(entradas.map((entrada) => entrada.juego.id))
      } catch {
        if (activo) setErrorBiblioteca('No pudimos consultar tu biblioteca. Volvé a abrir el catálogo para intentar nuevamente antes de agregar juegos.')
      } finally {
        if (activo) setCargandoBiblioteca(false)
      }
    }

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
    void cargarBiblioteca()

    // Ignora el resultado de esta consulta si se abandona la pantalla.
    return () => {
      activo = false
      montado.current = false
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
      {cargandoBiblioteca && <p className="secondary-text" role="status">Consultando tu biblioteca…</p>}
      {errorBiblioteca && <p className="placeholder-panel p-3" role="alert">{errorBiblioteca}</p>}
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
          {juegosOrdenados.map((juego) => (
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
                <button
                  className="btn btn-primary w-100 mt-4"
                  type="button"
                  disabled={cargandoBiblioteca || Boolean(errorBiblioteca) || juegosGuardados.includes(juego.id) || agregando.includes(juego.id)}
                  onClick={() => void agregarJuego(juego.id)}
                >
                  {juegosGuardados.includes(juego.id)
                    ? 'Ya está en tu biblioteca'
                    : agregando.includes(juego.id) ? 'Agregando...' : 'Agregar a mi biblioteca'}
                </button>
                {mensajes[juego.id] && (
                  <p className="secondary-text mt-3 mb-0" role={mensajes[juego.id].error ? 'alert' : 'status'}>
                    {mensajes[juego.id].texto}
                  </p>
                )}
              </article>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
export default CatalogPage
