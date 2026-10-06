import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { obtenerRecomendaciones } from '../../services/recomendaciones.service'
import type { RespuestaRecomendaciones } from '../../types/recomendacion'

// Usuario temporal hasta contar con autenticación.
const USUARIO_PRUEBA_ID = 2

function RecommendationsPage() {
  const [respuesta, setRespuesta] = useState<RespuestaRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargarRecomendaciones() {
      try {
        const datos = await obtenerRecomendaciones(USUARIO_PRUEBA_ID)
        if (activo) setRespuesta(datos)
      } catch (error) {
        if (!activo) return
        setError(isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Verificá la conexión y volvé a abrir esta página para intentar nuevamente.'
          : 'No pudimos cargar las recomendaciones. Intentá volver a esta página más tarde.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarRecomendaciones()
    return () => { activo = false }
  }, [])

  return (
    <>
      <PageHeader title="Recomendaciones" description="Descubrí nuevas opciones para tu próxima sesión de juego." />
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando recomendaciones…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : !respuesta || respuesta.recomendaciones.length === 0 ? (
        <section className="placeholder-panel p-4">
          <h2 className="h4">Todavía no hay recomendaciones disponibles</h2>
          {respuesta?.mensaje && <p className="secondary-text">{respuesta.mensaje}</p>}
          <p className="secondary-text">Agregar juegos a tu biblioteca puede ayudar a encontrar nuevas recomendaciones.</p>
          <Link className="btn btn-outline-secondary" to="/catalogo">Explorar catálogo</Link>
        </section>
      ) : (
        <>
          {respuesta.mensaje && <p className="secondary-text">{respuesta.mensaje}</p>}
          <div className="row g-3">
            {respuesta.recomendaciones.map(({ juego, puntaje, motivos }) => (
              <div className="col-12 col-md-6 col-xl-4" key={juego.id}>
                <article className="placeholder-panel h-100 p-4 text-break">
                  <span className="status-label mb-3">Puntaje de recomendación: <strong className="fs-5">{puntaje}</strong></span>
                  <h2 className="h4">{juego.titulo}</h2>
                  {juego.descripcion && <p className="secondary-text">{juego.descripcion}</p>}
                  <dl>
                    {juego.desarrollador && <><dt>Desarrollador</dt><dd className="secondary-text">{juego.desarrollador}</dd></>}
                    {juego.generos.length > 0 && <><dt>Géneros</dt><dd className="secondary-text">{juego.generos.map((genero) => genero.nombre).join(', ')}</dd></>}
                    {juego.plataformas.length > 0 && <><dt>Plataformas</dt><dd className="secondary-text">{juego.plataformas.map((plataforma) => plataforma.nombre).join(', ')}</dd></>}
                    {juego.caracteristicas.length > 0 && <><dt>Características</dt><dd className="secondary-text">{juego.caracteristicas.map((caracteristica) => caracteristica.nombre).join(', ')}</dd></>}
                  </dl>
                  <h3 className="h6">¿Por qué se recomienda?</h3>
                  <ul className="secondary-text small ps-3 mb-0">
                    {motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
export default RecommendationsPage
