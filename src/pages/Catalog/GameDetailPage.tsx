import { useEffect, useState } from 'react'
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
      <Link className="btn btn-outline-secondary game-detail-back" to="/catalogo">Volver al catálogo</Link>
      {cargando ? <p role="status">Cargando detalle...</p> : error ? <p role="alert">{error}</p> : juego && (
        <>
          <article className="game-detail-panel">
            <div className="row g-4">
              <div className="col-12 col-md-6">
                {juego.urlImagen?.trim() ? (
                  <img className="catalog-detail-image" src={juego.urlImagen} alt={`Portada de ${juego.titulo}`} />
                ) : (
                  <div className="catalog-detail-image catalog-cover-fallback" role="img" aria-label={`Sin imagen para ${juego.titulo}`}>
                    <span>{juego.titulo.trim().charAt(0).toLocaleUpperCase('es')}</span>
                  </div>
                )}
              </div>
              <div className="col-12 col-md-6 text-break">
                <h1 className="game-detail-title">{juego.titulo}</h1>
                <p className="secondary-text game-detail-description">{juego.descripcion?.trim() || 'No disponible'}</p>
                <dl className="catalog-detail-data mb-0">
                  <dt>Desarrollador</dt><dd>{juego.desarrollador?.trim() || 'No disponible'}</dd>
                  <dt>Fecha de lanzamiento</dt><dd>{juego.fechaLanzamiento?.trim() || 'No disponible'}</dd>
                  <dt>Géneros</dt><dd className="game-detail-chips">{juego.generos.length ? juego.generos.map((genero) => <span className="catalog-chip" key={genero.id}>{genero.nombre}</span>) : 'No disponible'}</dd>
                  <dt>Plataformas</dt><dd className="game-detail-chips">{juego.plataformas.length ? juego.plataformas.map((plataforma) => <span className="catalog-chip catalog-chip-platform" key={plataforma.id}>{plataforma.nombre}</span>) : 'No disponible'}</dd>
                  <dt>Características</dt><dd className="game-detail-chips">{juego.caracteristicas.length ? juego.caracteristicas.map((caracteristica) => <span className="catalog-chip" key={caracteristica.id}>{caracteristica.nombre}</span>) : 'No disponible'}</dd>
                </dl>
              </div>
            </div>
          </article>
          <section className="game-detail-panel game-detail-offers mt-4" aria-labelledby="ofertas-titulo">
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
