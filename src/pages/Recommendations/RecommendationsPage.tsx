import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { obtenerRecomendaciones } from '../../services/recomendaciones.service'
import { agregarJuegoABiblioteca } from '../../services/bibliotecas.service'
import type { RespuestaRecomendaciones } from '../../types/recomendacion'

// Usuario temporal hasta contar con autenticación.
const USUARIO_PRUEBA_ID = 2

function RecommendationsPage() {
  const [respuesta, setRespuesta] = useState<RespuestaRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState<number[]>([])
  const [guardados, setGuardados] = useState<number[]>([])
  const [mensajes, setMensajes] = useState<Record<number, { texto: string; error: boolean }>>({})
  const [actualizando, setActualizando] = useState(false)
  const [errorActualizacion, setErrorActualizacion] = useState<string | null>(null)
  const enCurso = useRef(new Set<number>())
  const agregados = useRef(new Set<number>())
  const montado = useRef(false)
  const versionConsulta = useRef(0)

  async function actualizarRanking() {
    const version = ++versionConsulta.current
    setActualizando(true)
    setErrorActualizacion(null)
    try {
      const datos = await obtenerRecomendaciones(USUARIO_PRUEBA_ID)
      // Solo la consulta más reciente puede reemplazar el ranking.
      if (montado.current && version === versionConsulta.current) setRespuesta(datos)
    } catch {
      if (montado.current && version === versionConsulta.current) {
        setErrorActualizacion('El juego está en tu biblioteca, pero no pudimos actualizar el ranking. Las recomendaciones visibles corresponden a la consulta anterior.')
      }
    } finally {
      if (montado.current && version === versionConsulta.current) setActualizando(false)
    }
  }

  async function agregarJuego(juegoId: number, titulo: string) {
    if (enCurso.current.has(juegoId) || agregados.current.has(juegoId)) return
    enCurso.current.add(juegoId)
    setAgregando((actuales) => [...actuales, juegoId])
    setMensajes((actuales) => {
      const siguientes = { ...actuales }
      delete siguientes[juegoId]
      return siguientes
    })

    try {
      let yaExistia = false
      try {
        await agregarJuegoABiblioteca({ usuarioId: USUARIO_PRUEBA_ID, juegoId })
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) yaExistia = true
        else throw error
      }
      if (!montado.current) return
      agregados.current.add(juegoId)
      setGuardados((actuales) => [...actuales, juegoId])
      setMensajes((actuales) => ({ ...actuales, [juegoId]: {
        texto: yaExistia ? `"${titulo}" ya estaba en tu biblioteca.` : `Se agregó "${titulo}" a tu biblioteca.`,
        error: false,
      } }))
      await actualizarRanking()
    } catch (error) {
      if (!montado.current) return
      const texto = isAxiosError(error) && !error.response
        ? `No pudimos conectar con el backend para agregar "${titulo}". Intentá nuevamente.`
        : `No pudimos agregar "${titulo}" a tu biblioteca. Intentá nuevamente.`
      setMensajes((actuales) => ({ ...actuales, [juegoId]: { texto, error: true } }))
    } finally {
      enCurso.current.delete(juegoId)
      if (montado.current) setAgregando((actuales) => actuales.filter((id) => id !== juegoId))
    }
  }

  useEffect(() => {
    let activo = true
    montado.current = true

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
    return () => {
      activo = false
      montado.current = false
    }
  }, [])

  return (
    <>
      <PageHeader title="Recomendaciones" description="Descubrí nuevas opciones para tu próxima sesión de juego." />
      {Object.entries(mensajes).map(([id, mensaje]) => (
        <p className="placeholder-panel p-3" key={id} role={mensaje.error ? 'alert' : 'status'}>{mensaje.texto}</p>
      ))}
      {actualizando && <p className="secondary-text small" role="status">Actualizando recomendaciones…</p>}
      {errorActualizacion && (
        <div className="placeholder-panel p-3 mb-3">
          <p role="alert">{errorActualizacion}</p>
          <button className="btn btn-outline-secondary btn-sm" type="button" disabled={actualizando}
            onClick={() => void actualizarRanking()}>Reintentar actualización</button>
        </div>
      )}
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
                  <button className="btn btn-primary w-100 mt-4" type="button"
                    disabled={agregando.includes(juego.id) || guardados.includes(juego.id)}
                    onClick={() => void agregarJuego(juego.id, juego.titulo)}>
                    {guardados.includes(juego.id) ? 'Ya está en tu biblioteca'
                      : agregando.includes(juego.id) ? 'Agregando...' : 'Agregar a mi biblioteca'}
                  </button>
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
