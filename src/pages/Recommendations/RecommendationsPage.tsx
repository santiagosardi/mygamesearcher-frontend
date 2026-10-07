import { useCallback, useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { obtenerRecomendaciones } from '../../services/recomendaciones.service'
import { agregarJuegoABiblioteca } from '../../services/bibliotecas.service'
import type { RespuestaRecomendaciones } from '../../types/recomendacion'
import { obtenerColecciones } from '../../services/colecciones.service'
import type { Coleccion } from '../../types/coleccion'
import recommendationsArtwork from '../../assets/home-cards/recommendations-group.png'


function RecommendationsPage() {
  const [respuesta, setRespuesta] = useState<RespuestaRecomendaciones | null>(null)
  const [cargando, setCargando] = useState(true)
  const [colecciones, setColecciones] = useState<Coleccion[]>([])
  const [cargandoColecciones, setCargandoColecciones] = useState(true)
  const [errorColecciones, setErrorColecciones] = useState<string | null>(null)
  const [fuente, setFuente] = useState('')
  const [fuenteRespuesta, setFuenteRespuesta] = useState('')
  const fuenteActual = useRef('')
  const [agregando, setAgregando] = useState<number[]>([])
  const [guardados, setGuardados] = useState<number[]>([])
  const [mensajes, setMensajes] = useState<Record<number, { texto: string; error: boolean }>>({})
  const [actualizando, setActualizando] = useState(false)
  const [errorActualizacion, setErrorActualizacion] = useState<string | null>(null)
  const enCurso = useRef(new Set<number>())
  const agregados = useRef(new Set<number>())
  const montado = useRef(false)
  const versionConsulta = useRef(0)

  const actualizarRanking = useCallback(async (despuesDeAgregar = false) => {
    const version = ++versionConsulta.current
    const fuenteConsultada = fuenteActual.current
    setActualizando(true)
    setErrorActualizacion(null)
    try {
      const datos = await obtenerRecomendaciones(fuenteConsultada ? Number(fuenteConsultada) : undefined)
      // Solo la consulta más reciente puede reemplazar el ranking.
      if (montado.current && version === versionConsulta.current) {
        setRespuesta(datos)
        setFuenteRespuesta(fuenteConsultada)
      }
    } catch (error) {
      if (montado.current && version === versionConsulta.current) {
        setErrorActualizacion(despuesDeAgregar
          ? 'El juego está en tu biblioteca, pero no pudimos actualizar el ranking. Si hay recomendaciones visibles, corresponden a la consulta anterior.'
          : isAxiosError(error) && !error.response
            ? 'No pudimos conectar con el backend. Intentá actualizar nuevamente.'
            : 'No pudimos cargar las recomendaciones de la fuente seleccionada. Intentá nuevamente.')
      }
    } finally {
      if (montado.current && version === versionConsulta.current) {
        setActualizando(false)
        setCargando(false)
      }
    }
  }, [])

  function cambiarFuente(valor: string) {
    fuenteActual.current = valor
    setFuente(valor)
    void actualizarRanking()
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
        await agregarJuegoABiblioteca(juegoId)
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
      await actualizarRanking(true)
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

    async function cargarColecciones() {
      try {
        const datos = await obtenerColecciones()
        if (activo) setColecciones(datos)
      } catch {
        if (activo) setErrorColecciones('No pudimos cargar tus colecciones. Podés seguir usando Toda mi biblioteca.')
      } finally {
        if (activo) setCargandoColecciones(false)
      }
    }

    void cargarColecciones()
    void actualizarRanking()
    return () => {
      activo = false
      montado.current = false
      versionConsulta.current += 1
    }
  }, [actualizarRanking])

  return (
    <div className="recommendations-page">
      <div className="recommendations-banner mb-4">
        <PageHeader title="Juegos elegidos para vos." description="Descubrí recomendaciones basadas en tus gustos, tu biblioteca y tus colecciones." />
        <div className="recommendations-banner-art" aria-hidden="true">
          <img src={recommendationsArtwork} alt="" width={1254} height={1254} />
        </div>
      </div>
      <div className="recommendations-source mb-4">
      <div className="row">
        <div className="col-12 col-md-8 col-lg-6">
          <label className="form-label" htmlFor="fuente-recomendaciones">Recomendar según</label>
          <select className="form-select catalog-search" id="fuente-recomendaciones" data-bs-theme="dark"
            value={fuente} onChange={(event) => cambiarFuente(event.target.value)} aria-describedby="descripcion-fuente">
            <option value="">Toda mi biblioteca</option>
            {colecciones.map((coleccion) => <option key={coleccion.id} value={coleccion.id}>{coleccion.nombre}</option>)}
          </select>
          <p className="secondary-text small mt-2 mb-0" id="descripcion-fuente">
            {fuente ? 'Las recomendaciones se calculan según los juegos de esta colección.' : 'Las recomendaciones se calculan según toda tu biblioteca.'}
          </p>
          {cargandoColecciones && <p className="secondary-text small mt-2" role="status">Cargando colecciones…</p>}
          {errorColecciones && <p className="secondary-text small mt-2" role="alert">{errorColecciones}</p>}
        </div>
      </div>
      </div>
      {respuesta && fuenteRespuesta !== fuente && (
        <p className="secondary-text small" role="status">El ranking visible corresponde a la fuente anterior hasta que se complete la nueva consulta.</p>
      )}
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
      ) : !respuesta && errorActualizacion ? (
        null
      ) : !respuesta || respuesta.recomendaciones.length === 0 ? (
        <section className="recommendations-empty placeholder-panel p-4 p-md-5">
          <h2 className="h4">Todavía no hay recomendaciones disponibles</h2>
          {respuesta?.mensaje && <p className="secondary-text">{respuesta.mensaje}</p>}
          <p className="secondary-text">Agregar juegos a tu biblioteca puede ayudar a encontrar nuevas recomendaciones.</p>
          <Link className="btn btn-outline-secondary" to="/catalogo">Explorar catálogo</Link>
        </section>
      ) : (
        <>
          {respuesta.mensaje && <p className="secondary-text">{respuesta.mensaje}</p>}
          <div className="row g-4">
            {respuesta.recomendaciones.map(({ juego, puntaje, motivos }) => (
              <div className="col-12 col-md-6 col-xl-4" key={juego.id}>
                <article className="recommendation-card catalog-game-card h-100 text-break">
                  <div className="catalog-cover" aria-hidden="true">
                    {juego.urlImagen?.trim() ? (
                      <img src={juego.urlImagen} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="catalog-cover-fallback"><span>{juego.titulo.trim().charAt(0).toLocaleUpperCase('es')}</span></div>
                    )}
                  </div>
                  <div className="recommendation-content">
                  <span className="recommendation-score status-label">Puntaje de recomendación: <strong className="fs-5">{puntaje}</strong></span>
                  <h2 className="h4">{juego.titulo}</h2>
                  {juego.descripcion && <p className="secondary-text">{juego.descripcion}</p>}
                  <dl className="recommendation-details">
                    {juego.desarrollador && <><dt>Desarrollador</dt><dd className="secondary-text">{juego.desarrollador}</dd></>}
                    {juego.generos.length > 0 && <><dt>Géneros</dt><dd className="secondary-text">{juego.generos.map((genero) => genero.nombre).join(', ')}</dd></>}
                    {juego.plataformas.length > 0 && <><dt>Plataformas</dt><dd className="secondary-text">{juego.plataformas.map((plataforma) => plataforma.nombre).join(', ')}</dd></>}
                    {juego.caracteristicas.length > 0 && <><dt>Características</dt><dd className="secondary-text">{juego.caracteristicas.map((caracteristica) => caracteristica.nombre).join(', ')}</dd></>}
                  </dl>
                  <div className="recommendation-reasons">
                  <h3 className="h6">¿Por qué se recomienda?</h3>
                  <ul className="secondary-text small ps-3 mb-0">
                    {motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
                  </ul>
                  </div>
                  <button className="recommendation-add btn btn-primary w-100" type="button"
                    disabled={agregando.includes(juego.id) || guardados.includes(juego.id)}
                    onClick={() => void agregarJuego(juego.id, juego.titulo)}>
                    {guardados.includes(juego.id) ? 'Ya está en tu biblioteca'
                      : agregando.includes(juego.id) ? 'Agregando...' : 'Agregar a mi biblioteca'}
                  </button>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export default RecommendationsPage
