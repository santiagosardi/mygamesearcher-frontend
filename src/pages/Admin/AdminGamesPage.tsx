import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { obtenerJuegos, crearJuego, actualizarJuego, eliminarJuego } from '../../services/juegos.service'
import { obtenerAtributos } from '../../services/atributos.service'
import type { ActualizarJuego, CrearJuego, Juego } from '../../types/juego'
import GameForm from './GameForm'
import { errorAdmin } from './errorAdmin'

function AdminGamesPage() {
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [atributos, setAtributos] = useState<Awaited<ReturnType<typeof obtenerAtributos>> | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorAtributos, setErrorAtributos] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<Juego | 'nuevo' | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const enCurso = useRef(false)
  const montado = useRef(false)

  useEffect(() => {
    let activo = true
    montado.current = true
    void obtenerJuegos().then((datos) => { if (activo) setJuegos(datos) })
      .catch((error) => { if (activo) setErrorCarga(errorAdmin(error)) })
      .finally(() => { if (activo) setCargando(false) })
    void obtenerAtributos().then((datos) => { if (activo) setAtributos(datos) })
      .catch((error) => { if (activo) setErrorAtributos(errorAdmin(error)) })
    return () => { activo = false; montado.current = false }
  }, [])

  async function guardar(datos: CrearJuego | ActualizarJuego) {
    if (enCurso.current || !formulario) return
    enCurso.current = true
    setProcesando(true)
    setMensaje(null)
    try {
      const nuevo = formulario === 'nuevo'
      const guardado = nuevo ? await crearJuego(datos as CrearJuego) : await actualizarJuego(formulario.id, datos)
      if (!montado.current) return
      setJuegos((actuales) => nuevo ? [...actuales, guardado] : actuales.map((juego) => juego.id === guardado.id ? guardado : juego))
      setBusqueda('')
      setFormulario(null)
      setMensaje({ texto: `Juego "${guardado.titulo}" ${nuevo ? 'creado' : 'actualizado'}.`, error: false })
    } catch (error) {
      if (montado.current) setMensaje({ texto: errorAdmin(error), error: true })
    } finally {
      enCurso.current = false
      if (montado.current) setProcesando(false)
    }
  }

  async function eliminar(juego: Juego) {
    if (enCurso.current || !window.confirm(`¿Querés eliminar "${juego.titulo}"? Esta operación elimina el juego del catálogo y puede afectar sus relaciones. No se puede deshacer.`)) return
    enCurso.current = true
    setEliminando(juego.id)
    setMensaje(null)
    try {
      await eliminarJuego(juego.id)
      if (!montado.current) return
      setJuegos((actuales) => actuales.filter((item) => item.id !== juego.id))
      setMensaje({ texto: `Juego "${juego.titulo}" eliminado.`, error: false })
    } catch (error) {
      if (montado.current) setMensaje({ texto: errorAdmin(error), error: true })
    } finally {
      enCurso.current = false
      if (montado.current) setEliminando(null)
    }
  }

  const visibles = juegos.filter((juego) => juego.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()))
  const bloqueado = procesando || eliminando !== null
  return (
    <>
      <PageHeader title="Administrar juegos" description="Gestioná los juegos y sus atributos en el catálogo." />
      <Link className="btn btn-outline-secondary mb-3" to="/admin">Volver al panel</Link>
      {mensaje && <p className="placeholder-panel p-3" role={mensaje.error ? 'alert' : 'status'}>{mensaje.texto}</p>}
      {errorAtributos && <p role="alert">No se pudieron cargar los atributos. {errorAtributos} Volvé a abrir esta página para crear o editar.</p>}
      <div className="row g-3 align-items-end mb-4">
        <div className="col-12 col-md-8">
          <label className="form-label" htmlFor="admin-busqueda">Buscar por título</label>
          <input className="form-control catalog-search" id="admin-busqueda" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
        </div>
        <div className="col-12 col-md-4">
          <button className="btn btn-primary w-100" type="button" disabled={bloqueado || !atributos || cargando || Boolean(errorCarga)}
            onClick={() => { setFormulario('nuevo'); setMensaje(null) }}>Crear juego</button>
        </div>
      </div>
      {formulario && atributos && <GameForm key={formulario === 'nuevo' ? 'nuevo' : formulario.id}
        juego={formulario === 'nuevo' ? undefined : formulario} atributos={atributos} procesando={procesando}
        onGuardar={(datos) => void guardar(datos)} onCancelar={() => { setFormulario(null); setMensaje(null) }} />}
      {cargando ? <p role="status">Cargando juegos…</p>
        : errorCarga ? <p className="placeholder-panel p-4" role="alert">{errorCarga}</p>
          : juegos.length === 0 ? <p className="placeholder-panel p-4">El catálogo está vacío.</p>
            : visibles.length === 0 ? <p className="placeholder-panel p-4" role="status">No se encontraron juegos con esa búsqueda.</p>
              : <div className="row g-3">
                {visibles.map((juego) => (
                  <div className="col-12 col-lg-6" key={juego.id}>
                    <article className="placeholder-panel h-100 p-4 text-break">
                      <h2 className="h4">{juego.titulo}</h2>
                      <p className="secondary-text">{juego.descripcion || 'Sin descripción.'}</p>
                      <dl>
                        <dt>Desarrollador</dt><dd className="secondary-text">{juego.desarrollador || 'No informado'}</dd>
                        <dt>Géneros</dt><dd className="secondary-text">{juego.generos.map((item) => item.nombre).join(', ') || 'Sin asignar'}</dd>
                        <dt>Plataformas</dt><dd className="secondary-text">{juego.plataformas.map((item) => item.nombre).join(', ') || 'Sin asignar'}</dd>
                        <dt>Características</dt><dd className="secondary-text">{juego.caracteristicas.map((item) => item.nombre).join(', ') || 'Sin asignar'}</dd>
                      </dl>
                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-outline-secondary" type="button" disabled={bloqueado || !atributos || formulario !== null}
                          onClick={() => { setFormulario(juego); setMensaje(null) }}>Editar</button>
                        <button className="btn btn-outline-secondary" type="button" disabled={bloqueado || formulario !== null}
                          onClick={() => void eliminar(juego)}>{eliminando === juego.id ? 'Eliminando...' : 'Eliminar'}</button>
                      </div>
                    </article>
                  </div>
                ))}
              </div>}
    </>
  )
}

export default AdminGamesPage
