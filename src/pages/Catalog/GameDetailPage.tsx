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
      <Link className="btn btn-outline-secondary mb-4" to="/catalogo">Volver al catálogo</Link>
      {cargando ? <p role="status">Cargando detalle...</p> : error ? <p role="alert">{error}</p> : juego && (
        <>
          <article className="game-detail-panel">
            <div className="row g-4">
              <div className="col-12 col-md-5">
                {juego.urlImagen?.trim() ? (
                  <img className="catalog-detail-image" src={juego.urlImagen} alt={`Portada de ${juego.titulo}`} />
                ) : (
                  <div className="catalog-detail-image catalog-cover-fallback" role="img" aria-label={`Sin imagen para ${juego.titulo}`}>
                    <span>{juego.titulo.trim().charAt(0).toLocaleUpperCase('es')}</span>
                  </div>
                )}
              </div>
              <div className="col-12 col-md-7 text-break">
                <h1 className="h2">{juego.titulo}</h1>
                <p className="secondary-text">{juego.descripcion?.trim() || 'No disponible'}</p>
                <dl className="catalog-detail-data mb-0">
                  <dt>Desarrollador</dt><dd>{juego.desarrollador?.trim() || 'No disponible'}</dd>
                  <dt>Fecha de lanzamiento</dt><dd>{juego.fechaLanzamiento?.trim() || 'No disponible'}</dd>
                  <dt>Géneros</dt><dd>{juego.generos.map((genero) => genero.nombre).join(', ') || 'No disponible'}</dd>
                  <dt>Plataformas</dt><dd>{juego.plataformas.map((plataforma) => plataforma.nombre).join(', ') || 'No disponible'}</dd>
                  <dt>Características</dt><dd>{juego.caracteristicas.map((caracteristica) => caracteristica.nombre).join(', ') || 'No disponible'}</dd>
                </dl>
              </div>
            </div>
          </article>
          <section className="game-detail-panel mt-4" aria-labelledby="ofertas-titulo">
            <h2 id="ofertas-titulo" className="h4">Ofertas / información externa</h2>
            {cargandoOfertas ? <p role="status">Consultando ofertas...</p> : errorOfertas ? <p role="alert">{errorOfertas}</p> : ofertas && (
              <>
                <p className="secondary-text">Fuente: {ofertas.fuente}</p>
                {ofertas.disponible ? (
                  <>
                    <p className="h5">Precio más bajo: USD {ofertas.precioMasBajoUSD}</p>
                    <p className="secondary-text">Mejor precio informado por CheapShark; no necesariamente es el precio de Steam.</p>
                    <div className="d-flex flex-wrap gap-2">
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
