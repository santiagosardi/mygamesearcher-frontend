import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import PageHeader from '../../components/PageHeader'
import { actualizarBiblioteca, eliminarBiblioteca, obtenerBiblioteca } from '../../services/bibliotecas.service'
import type { ActualizarBiblioteca, Biblioteca, EstadoBiblioteca } from '../../types/biblioteca'
import { Link } from 'react-router-dom'
import libraryArtwork from '../../assets/home-cards/library-panther.webp'


const prioridadEstado: Record<EstadoBiblioteca, number> = {
  PENDIENTE: 0,
  JUGANDO: 1,
  COMPLETADO: 2,
  ABANDONADO: 3,
}

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
  const [procesando, setProcesando] = useState<number[]>([])
  const [mensajes, setMensajes] = useState<Record<number, { texto: string; error: boolean }>>({})
  const [confirmacionEliminacion, setConfirmacionEliminacion] = useState('')
  const solicitudesEnCurso = useRef(new Set<number>())
  const montado = useRef(false)
  const bibliotecaOrdenada = [...biblioteca].sort((a, b) =>
    prioridadEstado[a.estado] - prioridadEstado[b.estado] ||
    a.juego.titulo.localeCompare(b.juego.titulo, 'es', { sensitivity: 'base' }),
  )

  // Sin datos se elimina; con datos se actualizan únicamente los campos enviados.
  async function administrarEntrada(entrada: Biblioteca, datos?: ActualizarBiblioteca) {
    if (solicitudesEnCurso.current.has(entrada.id)) return
    if (!datos && !window.confirm(`¿Querés eliminar "${entrada.juego.titulo}" de tu biblioteca?`)) return

    solicitudesEnCurso.current.add(entrada.id)
    setProcesando((actuales) => [...actuales, entrada.id])
    setConfirmacionEliminacion('')
    setMensajes((actuales) => {
      const siguientes = { ...actuales }
      delete siguientes[entrada.id]
      return siguientes
    })

    try {
      if (datos) {
        const actualizada = await actualizarBiblioteca(entrada.id, datos)
        if (!montado.current) return
        setBiblioteca((actuales) => actuales.map((item) => item.id === entrada.id ? actualizada : item))
        const texto = datos.estado !== undefined
          ? 'Estado actualizado.'
          : actualizada.favorito ? 'Juego marcado como favorito.' : 'Juego quitado de favoritos.'
        setMensajes((actuales) => ({ ...actuales, [entrada.id]: { texto, error: false } }))
      } else {
        await eliminarBiblioteca(entrada.id)
        if (!montado.current) return
        setBiblioteca((actuales) => actuales.filter((item) => item.id !== entrada.id))
        setConfirmacionEliminacion(`Se eliminó "${entrada.juego.titulo}" de tu biblioteca.`)
      }
    } catch (error) {
      if (!montado.current) return
      const texto = isAxiosError(error) && !error.response
        ? 'No pudimos conectar con el backend. Verificá la conexión e intentá nuevamente.'
        : datos ? 'No pudimos guardar el cambio. Intentá nuevamente.' : 'No pudimos eliminar el juego. Intentá nuevamente.'
      setMensajes((actuales) => ({ ...actuales, [entrada.id]: { texto, error: true } }))
    } finally {
      solicitudesEnCurso.current.delete(entrada.id)
      if (montado.current) setProcesando((actuales) => actuales.filter((id) => id !== entrada.id))
    }
  }

  useEffect(() => {
    let activo = true
    montado.current = true

    async function cargarBiblioteca() {
      try {
        const datos = await obtenerBiblioteca()
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
      montado.current = false
    }
  }, [])

  return (
    <div className="library-page">
      <div className="library-banner mb-4">
        <PageHeader title="Tu biblioteca. Tus juegos." description="Tu espacio personal para reunir videojuegos y organizar lo que querés jugar." />
        <div className="library-banner-art" aria-hidden="true">
          <img src={libraryArtwork} alt="" width={1254} height={1254} />
        </div>
      </div>
      {confirmacionEliminacion && <p className="placeholder-panel p-3" role="status">{confirmacionEliminacion}</p>}
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando biblioteca…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : biblioteca.length === 0 ? (
        <section className="library-empty p-4 p-md-5">
          <span className="library-empty-mark" aria-hidden="true">♡</span>
          <h2 className="h4">Tu biblioteca está vacía</h2>
          <p className="secondary-text">Los juegos que agregues aparecerán acá para que puedas organizarlos y elegir qué jugar.</p>
          <Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link>
        </section>
      ) : (
        <div className="row g-4">
          {bibliotecaOrdenada.map((entrada) => (
            <div className="col-12 col-md-6 col-xl-4" key={entrada.id}>
              <article className="library-game-card catalog-game-card h-100 text-break">
                <div className="catalog-cover" aria-hidden="true">
                  {entrada.juego.urlImagen?.trim() ? (
                    <img src={entrada.juego.urlImagen} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="catalog-cover-fallback"><span>{entrada.juego.titulo.trim().charAt(0).toLocaleUpperCase('es')}</span></div>
                  )}
                </div>
                <div className="library-game-content">
                <h2 className="h4">{entrada.juego.titulo}</h2>
                <p className="library-game-description secondary-text">{entrada.juego.descripcion?.trim() || 'Sin descripción disponible.'}</p>
                <dl className="library-game-details mb-0">
                  <dt>Estado</dt>
                  <dd className={`library-state library-state-${entrada.estado.toLowerCase()}`}>{etiquetasEstado[entrada.estado]}</dd>
                  <dt>Favorito</dt>
                  <dd className={entrada.favorito ? 'library-favorite is-favorite' : 'library-favorite'}>{entrada.favorito ? 'Sí' : 'No'}</dd>
                  <dt>Fecha de agregado</dt>
                  <dd className="secondary-text mb-0">{formatearFecha(entrada.fechaAgregado)}</dd>
                </dl>
                <fieldset className="library-actions" disabled={procesando.includes(entrada.id)}>
                  <legend className="visually-hidden">Administrar {entrada.juego.titulo}</legend>
                  <label className="form-label" htmlFor={`estado-${entrada.id}`}>Cambiar estado</label>
                  <select
                    className="form-select catalog-search"
                    data-bs-theme="dark"
                    id={`estado-${entrada.id}`}
                    value={entrada.estado}
                    onChange={(event) => {
                      const estado = event.target.value as EstadoBiblioteca
                      if (estado !== entrada.estado) void administrarEntrada(entrada, { estado })
                    }}
                  >
                    {Object.entries(etiquetasEstado).map(([valor, etiqueta]) => (
                      <option value={valor} key={valor}>{etiqueta}</option>
                    ))}
                  </select>
                  <div className="d-flex flex-column gap-2 mt-3">
                    <button className="library-favorite-button btn btn-outline-secondary" type="button"
                      onClick={() => void administrarEntrada(entrada, { favorito: !entrada.favorito })}>
                      {entrada.favorito ? 'Quitar favorito' : 'Marcar favorito'}
                    </button>
                    <button className="library-delete-button btn btn-outline-secondary" type="button"
                      onClick={() => void administrarEntrada(entrada)}>
                      Eliminar de biblioteca
                    </button>
                  </div>
                </fieldset>
                {procesando.includes(entrada.id) && <p className="secondary-text mt-3 mb-0" role="status">Procesando…</p>}
                {mensajes[entrada.id] && (
                  <p className="secondary-text mt-3 mb-0" role={mensajes[entrada.id].error ? 'alert' : 'status'}>
                    {mensajes[entrada.id].texto}
                  </p>
                )}
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default LibraryPage
