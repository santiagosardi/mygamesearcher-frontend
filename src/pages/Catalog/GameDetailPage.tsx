import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useAuth } from '../../auth/useAuth'
import { agregarJuegoABiblioteca, obtenerBiblioteca } from '../../services/bibliotecas.service'
import { Link, useParams } from 'react-router-dom'
import { obtenerJuegoPorId, obtenerOfertasJuego } from '../../services/juegos.service'
import type { Juego, OfertasJuego } from '../../types/juego'

function GameDetailPage() {
  const { id } = useParams()
  const [juego, setJuego] = useState<Juego | null>(null)
  const [ofertas, setOfertas] = useState<OfertasJuego | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoOfertas, setCargandoOfertas] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorOfertas, setErrorOfertas] = useState<string | null>(null)
  const { isAuthenticated, isLoading, user } = useAuth()
  const [guardado, setGuardado] = useState(false)
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(true)
  const [errorBiblioteca, setErrorBiblioteca] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const versionBiblioteca = useRef(0)
  const envioEnCurso = useRef(false)

  useEffect(() => {
    let activo = true
    versionBiblioteca.current += 1
    envioEnCurso.current = false
    setAgregando(false)
    setGuardado(false)
    setMensaje(null)
    setErrorBiblioteca(null)
    setCargandoBiblioteca(false)
    if (!isLoading && isAuthenticated && juego?.id === Number(id)) {
      setCargandoBiblioteca(true)
      void obtenerBiblioteca().then((entradas) => {
        if (activo) setGuardado(entradas.some((entrada) => entrada.juego.id === juego.id))
      }).catch((error) => {
        if (activo) setErrorBiblioteca(isAxiosError(error) && error.response?.status === 401
          ? 'Tu sesión venció. Cerrá sesión e ingresá nuevamente para consultar tu biblioteca.'
          : 'No pudimos consultar tu biblioteca. Volvé a abrir el detalle para intentar nuevamente.')
      }).finally(() => { if (activo) setCargandoBiblioteca(false) })
    }
    return () => { activo = false; versionBiblioteca.current += 1 }
  }, [id, juego, isLoading, isAuthenticated, user])

  async function agregarJuego() {
    if (!juego || !isAuthenticated || isLoading || cargandoBiblioteca || errorBiblioteca || guardado || envioEnCurso.current) return
    const version = versionBiblioteca.current
    envioEnCurso.current = true
    setAgregando(true)
    setMensaje(null)
    try {
      await agregarJuegoABiblioteca(juego.id)
      if (version !== versionBiblioteca.current) return
      setGuardado(true)
      setMensaje({ texto: 'Juego agregado a tu biblioteca.', error: false })
    } catch (error) {
      if (version !== versionBiblioteca.current) return
      if (isAxiosError(error) && error.response?.status === 409) {
        setGuardado(true)
        setMensaje({ texto: 'Este juego ya estaba en tu biblioteca.', error: false })
      } else {
        setMensaje({ texto: isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Verificá la conexión e intentá nuevamente.'
          : 'No pudimos agregar el juego. Intentá nuevamente.', error: true })
      }
    } finally {
      if (version === versionBiblioteca.current) {
        envioEnCurso.current = false
        setAgregando(false)
      }
    }
  }

  useEffect(() => {
    let activo = true
    const juegoId = Number(id)
    setJuego(null)
    setOfertas(null)
    setError(null)
    setErrorOfertas(null)
    setCargando(true)
    setCargandoOfertas(true)
    if (!Number.isSafeInteger(juegoId) || juegoId <= 0) {
      setError('Juego no disponible. El identificador no es válido.')
      setCargando(false)
      setCargandoOfertas(false)
      return () => { activo = false }
    }

    void obtenerJuegoPorId(juegoId).then((datos) => {
      if (activo) setJuego(datos)
    }).catch(() => {
      if (activo) setError('No pudimos cargar el detalle del juego. Puede no estar disponible. Intentá nuevamente.')
    }).finally(() => { if (activo) setCargando(false) })

    void obtenerOfertasJuego(juegoId).then((datos) => {
      if (activo) setOfertas(datos)
    }).catch(() => {
      if (activo) setErrorOfertas('No pudimos consultar las ofertas externas en este momento.')
    }).finally(() => { if (activo) setCargandoOfertas(false) })

    return () => { activo = false }
  }, [id])

  return (
    <div className="game-detail-page">
      <Link className="game-detail-back" to="/catalogo"><span aria-hidden="true">←</span> Volver al catálogo</Link>
      {cargando ? <p role="status">Cargando detalle...</p> : error ? <p role="alert">{error}</p> : juego && (
        <>
          <article className="game-detail-panel">
            <div className="row g-4">
              <div className="col-12 col-md-6 game-detail-cover-column">
                <div className="game-detail-cover">
                {juego.urlImagen?.trim() ? (
                  <img className="catalog-detail-image" src={juego.urlImagen} alt={`Portada de ${juego.titulo}`} />
                ) : (
                  <div className="catalog-detail-image catalog-cover-fallback" role="img" aria-label={`Sin imagen para ${juego.titulo}`}>
                    <span>{juego.titulo.trim().charAt(0).toLocaleUpperCase('es')}</span>
                  </div>
                )}
                </div>
              </div>
              <div className="col-12 col-md-6 text-break">
                <h1 className="game-detail-title">{juego.titulo}</h1>
                <p className="secondary-text game-detail-description">{juego.descripcion?.trim() || 'No disponible'}</p>
                <dl className="game-detail-meta">
                  <div><dt>Desarrollador</dt><dd>{juego.desarrollador?.trim() || 'No disponible'}</dd></div>
                  <div><dt>Fecha de lanzamiento</dt><dd>{juego.fechaLanzamiento?.trim() || 'No disponible'}</dd></div>
                </dl>
                <dl className="catalog-detail-data mb-0">
                  <dt>Géneros</dt><dd className="game-detail-chips">{juego.generos.length ? juego.generos.map((genero) => <span className="catalog-chip" key={genero.id}>{genero.nombre}</span>) : 'No disponible'}</dd>
                  <dt>Plataformas</dt><dd className="game-detail-chips">{juego.plataformas.length ? juego.plataformas.map((plataforma) => <span className="catalog-chip catalog-chip-platform" key={plataforma.id}>{plataforma.nombre}</span>) : 'No disponible'}</dd>
                  <dt>Características</dt><dd className="game-detail-chips game-detail-features">{juego.caracteristicas.length ? juego.caracteristicas.map((caracteristica) => <span className="catalog-chip" key={caracteristica.id}>{caracteristica.nombre}</span>) : 'No disponible'}</dd>
                </dl>
                <div className="mt-4">
                  {!isLoading && !isAuthenticated ? (
                    <Link className="btn btn-primary w-100" to="/login">Iniciar sesión para agregar</Link>
                  ) : (
                    <button className="btn btn-primary w-100" type="button"
                      disabled={isLoading || cargandoBiblioteca || Boolean(errorBiblioteca) || guardado || agregando}
                      onClick={() => void agregarJuego()}>
                      {guardado ? 'Ya está en tu biblioteca' : agregando ? 'Agregando...' : 'Agregar a mi biblioteca'}
                    </button>
                  )}
                  {cargandoBiblioteca && <p className="secondary-text mt-2 mb-0" role="status">Consultando tu biblioteca…</p>}
                  {errorBiblioteca && <p className="secondary-text mt-2 mb-0" role="alert">{errorBiblioteca}</p>}
                  {mensaje && <p className="secondary-text mt-2 mb-0" role={mensaje.error ? 'alert' : 'status'}>{mensaje.texto}</p>}
                </div>
              </div>
            </div>
          </article>
          <section className="game-detail-panel game-detail-offers mt-4" aria-labelledby="ofertas-titulo">
            <p className="game-detail-eyebrow">API EXTERNA</p>
            <h2 id="ofertas-titulo" className="h4">Ofertas / información externa</h2>
            {cargandoOfertas ? <p role="status">Consultando ofertas...</p> : errorOfertas ? <p role="alert">{errorOfertas}</p> : ofertas && (
              <>
                <p className="secondary-text game-detail-source">Fuente: {ofertas.fuente}</p>
                {ofertas.disponible ? (
                  <>
                    <p className="game-detail-price">Precio más bajo: USD {ofertas.precioMasBajoUSD}</p>
                    <p className="secondary-text game-detail-price-note">Mejor precio informado por CheapShark; no necesariamente es el precio de Steam.</p>
                    <div className="d-flex flex-wrap gap-2 game-detail-offer-actions">
                      <a className="btn btn-primary" href={ofertas.urlOferta} target="_blank" rel="noopener noreferrer">Ver oferta</a>
                      {ofertas.urlSteam && <a className="btn btn-outline-secondary" href={ofertas.urlSteam} target="_blank" rel="noopener noreferrer">Ver en Steam</a>}
                    </div>
                  </>
                ) : <p className="secondary-text mb-0">No encontramos ofertas externas para este juego.</p>}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default GameDetailPage
