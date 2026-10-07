import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { actualizarColeccion, eliminarColeccion } from '../../services/colecciones.service'
import type { ActualizarColeccion, Coleccion } from '../../types/coleccion'
import type { Juego } from '../../types/juego'

type Props = {
  idsBiblioteca: ReadonlySet<number>
  cargandoBiblioteca: boolean
  errorBiblioteca: string | null
  coleccion: Coleccion
  juegos: Juego[]
  cargandoJuegos: boolean
  errorJuegos: string | null
  onActualizar: (coleccion: Coleccion) => void
  onEliminar: (coleccion: Coleccion) => void
}

function CollectionCard({ coleccion, juegos, cargandoJuegos, errorJuegos, onActualizar, onEliminar, idsBiblioteca, cargandoBiblioteca, errorBiblioteca }: Props) {
  const [editando, setEditando] = useState(false)
  const [gestionando, setGestionando] = useState(false)
  const [busquedaJuegos, setBusquedaJuegos] = useState('')
  const [filtroJuegos, setFiltroJuegos] = useState('todos')
  const [nombre, setNombre] = useState(coleccion.nombre)
  const [descripcion, setDescripcion] = useState(coleccion.descripcion ?? '')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const enCurso = useRef(false)
  const montado = useRef(false)

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  async function guardar(datos: ActualizarColeccion, texto: string, cerrarEdicion = false) {
    if (enCurso.current) return
    enCurso.current = true
    setProcesando(true)
    setMensaje(null)
    try {
      const actualizada = await actualizarColeccion(coleccion.id, datos)
      if (!montado.current) return
      onActualizar(actualizada)
      if (cerrarEdicion) setEditando(false)
      setMensaje({ texto, error: false })
    } catch (error) {
      if (!montado.current) return
      const textoError = isAxiosError(error) && error.response?.status === 409
        ? 'Ya existe una colección con ese nombre. Elegí otro nombre.'
        : isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Intentá nuevamente.'
          : 'No pudimos guardar el cambio. Los datos anteriores se conservaron.'
      setMensaje({ texto: textoError, error: true })
    } finally {
      enCurso.current = false
      if (montado.current) setProcesando(false)
    }
  }

  function guardarEdicion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enCurso.current) return
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio || nombreLimpio.length > 100) {
      setMensaje({ texto: 'Ingresá un nombre de entre 1 y 100 caracteres.', error: true })
      return
    }
    const datos: ActualizarColeccion = {}
    if (nombreLimpio !== coleccion.nombre) datos.nombre = nombreLimpio
    if (descripcion.trim() !== (coleccion.descripcion ?? '')) datos.descripcion = descripcion.trim()
    if (Object.keys(datos).length === 0) {
      setEditando(false)
      setMensaje({ texto: 'No hay cambios para guardar.', error: false })
      return
    }
    void guardar(datos, 'Colección actualizada.', true)
  }

  async function eliminar() {
    if (enCurso.current || !window.confirm(`¿Querés eliminar la colección "${coleccion.nombre}"? Los juegos del catálogo se conservarán.`)) return
    enCurso.current = true
    setProcesando(true)
    setMensaje(null)
    try {
      await eliminarColeccion(coleccion.id)
      if (montado.current) onEliminar(coleccion)
    } catch (error) {
      if (montado.current) setMensaje({
        texto: isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Intentá nuevamente.'
          : 'No pudimos eliminar la colección. Intentá nuevamente.',
        error: true,
      })
    } finally {
      enCurso.current = false
      if (montado.current) setProcesando(false)
    }
  }

  function cambiarJuego(juegoId: number) {
    const ids = new Set(coleccion.juegos.map((juego) => juego.id))
    const pertenece = ids.has(juegoId)
    if (pertenece) ids.delete(juegoId)
    else ids.add(juegoId)
    void guardar({ juegoIds: [...ids] }, pertenece ? 'Juego quitado de la colección.' : 'Juego agregado a la colección.')
  }

  const fecha = new Date(coleccion.fechaCreacion)
  // Incluye también juegos asociados que no aparezcan en la lista del catálogo.
  const opciones = Array.from(new Map([...juegos, ...coleccion.juegos].map((juego) => [juego.id, juego])).values())
  const textoBuscado = busquedaJuegos.trim().toLowerCase()
  const opcionesFiltradas = opciones.filter((juego) =>
    juego.titulo.toLowerCase().includes(textoBuscado) &&
    (filtroJuegos === 'todos' ||
      (filtroJuegos === 'biblioteca' ? idsBiblioteca.has(juego.id) : coleccion.juegos.some((actual) => actual.id === juego.id))),
  )

  return (
    <article className="placeholder-panel h-100 p-4 text-break">
      <h2 className="h4">{coleccion.nombre}</h2>
      {coleccion.descripcion && <p className="secondary-text">{coleccion.descripcion}</p>}
      <dl>
        <dt>Fecha de creación</dt>
        <dd className="secondary-text">{Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : fecha.toLocaleDateString('es-AR')}</dd>
        <dt>Cantidad de juegos</dt>
        <dd className="secondary-text">{coleccion.juegos.length}</dd>
      </dl>
      <fieldset disabled={procesando}>
        <legend className="visually-hidden">Administrar {coleccion.nombre}</legend>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-secondary" type="button" onClick={() => {
            setNombre(coleccion.nombre)
            setDescripcion(coleccion.descripcion ?? '')
            setEditando(true)
            setGestionando(false)
            setMensaje(null)
          }}>Editar</button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => {
            setGestionando(!gestionando)
            setEditando(false)
          }}>{gestionando ? 'Cerrar juegos' : 'Gestionar juegos'}</button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => void eliminar()}>Eliminar colección</button>
        </div>
        {editando && (
          <form className="mt-3" onSubmit={guardarEdicion}>
            <label className="form-label" htmlFor={`nombre-${coleccion.id}`}>Nombre</label>
            <input className="form-control catalog-search mb-3" id={`nombre-${coleccion.id}`} required maxLength={100}
              value={nombre} onChange={(event) => setNombre(event.target.value)} />
            <label className="form-label" htmlFor={`descripcion-${coleccion.id}`}>Descripción</label>
            <textarea className="form-control catalog-search" id={`descripcion-${coleccion.id}`} rows={3}
              value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn btn-primary" type="submit">Guardar cambios</button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditando(false); setMensaje(null) }}>Cancelar</button>
            </div>
          </form>
        )}
        {gestionando && (
          <section className="mt-3" aria-label={`Juegos de ${coleccion.nombre}`}>
            <h3 className="h5">Juegos de la colección</h3>
            <p className="secondary-text small mb-3">{coleccion.juegos.length} juegos en esta colección</p>
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label small" htmlFor={`buscar-juego-${coleccion.id}`}>Buscar por título</label>
                <input className="form-control form-control-sm catalog-search" type="search"
                  id={`buscar-juego-${coleccion.id}`} placeholder="Buscar juego..."
                  value={busquedaJuegos} onChange={(event) => setBusquedaJuegos(event.target.value)} />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label small" htmlFor={`filtro-juego-${coleccion.id}`}>Mostrar</label>
                <select className="form-select form-select-sm catalog-search" data-bs-theme="dark"
                  id={`filtro-juego-${coleccion.id}`} value={filtroJuegos}
                  onChange={(event) => setFiltroJuegos(event.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="coleccion">En esta colección</option>
                  <option value="biblioteca" disabled={cargandoBiblioteca || Boolean(errorBiblioteca)}>En mi biblioteca</option>
                </select>
              </div>
            </div>
            {cargandoBiblioteca && <p className="secondary-text small" role="status">Cargando biblioteca…</p>}
            {errorBiblioteca && <p className="secondary-text small" role="alert">{errorBiblioteca}</p>}
            {cargandoJuegos ? <p role="status">Cargando catálogo…</p>
              : errorJuegos ? <p role="alert">{errorJuegos}</p>
                : filtroJuegos === 'biblioteca' && idsBiblioteca.size === 0
                  ? <p className="secondary-text" role="status">No tenés juegos en tu biblioteca.</p>
                : filtroJuegos === 'coleccion' && coleccion.juegos.length === 0
                  ? <p className="secondary-text" role="status">Esta colección todavía no tiene juegos.</p>
                  : opciones.length === 0 ? <p className="secondary-text" role="status">No hay juegos disponibles.</p>
                    : opcionesFiltradas.length === 0
                      ? <p className="secondary-text" role="status">No se encontraron juegos con esa búsqueda y filtro.</p>
                  : <ul className="list-unstyled mb-0 collection-game-list" tabIndex={0} aria-label="Listado de juegos">
                    {opcionesFiltradas.map((juego) => {
                      const pertenece = coleccion.juegos.some((actual) => actual.id === juego.id)
                      return (
                        <li className="collection-game-row border-top py-2" key={juego.id}>
                          <div className="collection-game-info">
                            <p className="small mb-0">{juego.titulo}</p>
                            <span className="secondary-text small">{pertenece ? 'En esta colección' : 'Fuera de la colección'}</span>
                          </div>
                          <button className="btn btn-outline-secondary btn-sm flex-shrink-0" type="button"
                            aria-label={`${pertenece ? 'Quitar' : 'Agregar'} ${juego.titulo}${pertenece ? ' de' : ' a'} la colección`}
                            onClick={() => cambiarJuego(juego.id)}>
                            {pertenece ? 'Quitar' : 'Agregar'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>}
          </section>
        )}
      </fieldset>
      {procesando && <p className="secondary-text mt-3 mb-0" role="status">Procesando…</p>}
      {mensaje && <p className="mt-3 mb-0" role={mensaje.error ? 'alert' : 'status'}>{mensaje.texto}</p>}
    </article>
  )
}

export default CollectionCard
