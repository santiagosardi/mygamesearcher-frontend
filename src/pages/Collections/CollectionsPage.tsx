import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import PageHeader from '../../components/PageHeader'
import { crearColeccion, obtenerColecciones } from '../../services/colecciones.service'
import type { Coleccion } from '../../types/coleccion'
import type { Juego } from '../../types/juego'
import { obtenerJuegos } from '../../services/juegos.service'
import CollectionCard from './CollectionCard'
import { obtenerBiblioteca } from '../../services/bibliotecas.service'
import type { Biblioteca } from '../../types/biblioteca'
import collectionsArtwork from '../../assets/home-cards/collections-hollow.png'


function CollectionsPage() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [creando, setCreando] = useState(false)
  const [errorCreacion, setErrorCreacion] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState('')
  const envioEnCurso = useRef(false)
  const montado = useRef(false)
  const [juegos, setJuegos] = useState<Juego[]>([])
  const [cargandoJuegos, setCargandoJuegos] = useState(true)
  const [errorJuegos, setErrorJuegos] = useState<string | null>(null)
  const [idsBiblioteca, setIdsBiblioteca] = useState<Set<number>>(new Set())
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(true)
  const [errorBiblioteca, setErrorBiblioteca] = useState<string | null>(null)
  const consultaBiblioteca = useRef<Promise<Biblioteca[]> | null>(null)

  function actualizarLocal(actualizada: Coleccion) {
    setColecciones((actuales) => actuales.map((coleccion) => coleccion.id === actualizada.id ? actualizada : coleccion))
  }

  function eliminarLocal(eliminada: Coleccion) {
    setColecciones((actuales) => actuales.filter((coleccion) => coleccion.id !== eliminada.id))
    setConfirmacion(`Se eliminó la colección "${eliminada.nombre}". Los juegos del catálogo se conservaron.`)
  }

  useEffect(() => {
    let activo = true
    montado.current = true

    async function cargarBiblioteca() {
      try {
        // Comparte la consulta también durante la repetición de efectos de StrictMode.
        consultaBiblioteca.current ??= obtenerBiblioteca()
        const entradas = await consultaBiblioteca.current
        if (activo) setIdsBiblioteca(new Set(entradas.map((entrada) => entrada.juego.id)))
      } catch {
        if (activo) setErrorBiblioteca('No pudimos cargar tu biblioteca. Podés seguir usando Todos y En esta colección.')
      } finally {
        if (activo) setCargandoBiblioteca(false)
      }
    }

    async function cargarJuegos() {
      try {
        const datos = await obtenerJuegos()
        if (activo) setJuegos(datos)
      } catch {
        if (activo) setErrorJuegos('No pudimos cargar el catálogo. Volvé a abrir esta página para intentar nuevamente.')
      } finally {
        if (activo) setCargandoJuegos(false)
      }
    }

    async function cargarColecciones() {
      try {
        const datos = await obtenerColecciones()
        if (activo) setColecciones(datos)
      } catch {
        if (activo) setError('No pudimos cargar tus colecciones. Verificá que el backend esté disponible y volvé a abrir esta página para intentar nuevamente.')
      } finally {
        if (activo) setCargando(false)
      }
    }

    void cargarColecciones()
    void cargarJuegos()
    void cargarBiblioteca()
    return () => {
      activo = false
      montado.current = false
    }
  }, [])

  async function enviarColeccion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (envioEnCurso.current || cargando || error) return
    setConfirmacion('')
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio || nombreLimpio.length > 100) {
      setErrorCreacion('Ingresá un nombre de entre 1 y 100 caracteres, sin contar los espacios externos.')
      return
    }

    envioEnCurso.current = true
    setCreando(true)
    setErrorCreacion(null)
    try {
      const nueva = await crearColeccion({
        nombre: nombreLimpio,
        ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
      })
      if (!montado.current) return
      setColecciones((actuales) => [...actuales, nueva])
      setNombre('')
      setDescripcion('')
      setConfirmacion(`Se creó la colección "${nueva.nombre}".`)
    } catch (error) {
      if (!montado.current) return
      const mensaje = isAxiosError(error) && error.response?.status === 409
        ? 'Ya existe una colección con ese nombre o se produjo un conflicto. Probá con otro nombre.'
        : isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el backend. Verificá la conexión e intentá nuevamente.'
          : 'No pudimos crear la colección. Revisá los datos e intentá nuevamente.'
      setErrorCreacion(mensaje)
    } finally {
      envioEnCurso.current = false
      if (montado.current) setCreando(false)
    }
  }

  return (
    <div className="collections-page">
      <div className="collections-banner mb-4">
        <PageHeader title="Armá tu propia colección." description="Organizá los juegos de tu biblioteca en grupos que tengan sentido para vos." />
        <div className="collections-banner-art" aria-hidden="true">
          <img src={collectionsArtwork} alt="" width={1254} height={1254} />
        </div>
      </div>
      <section className="collections-create placeholder-panel p-4 mb-4" aria-labelledby="crear-coleccion-title">
        <h2 className="h4 mb-3" id="crear-coleccion-title">Crear colección</h2>
        <form onSubmit={(event) => void enviarColeccion(event)}>
          <fieldset disabled={creando || cargando || Boolean(error)}>
            <legend className="visually-hidden">Datos de la nueva colección</legend>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="nombre-coleccion">Nombre</label>
                <input className="form-control catalog-search" id="nombre-coleccion"
                  required maxLength={100} value={nombre}
                  onChange={(event) => setNombre(event.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="descripcion-coleccion">Descripción (opcional)</label>
                <textarea className="form-control catalog-search" id="descripcion-coleccion"
                  rows={3} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary mt-3" type="submit">{creando ? 'Creando...' : 'Crear colección'}</button>
          </fieldset>
          {creando && <p className="secondary-text mt-3 mb-0" role="status">Creando colección…</p>}
          {errorCreacion && <p className="mt-3 mb-0" role="alert">{errorCreacion}</p>}
          {confirmacion && <p className="secondary-text mt-3 mb-0" role="status">{confirmacion}</p>}
        </form>
      </section>
      {cargando ? (
        <p className="placeholder-panel p-4 secondary-text" role="status">Cargando colecciones…</p>
      ) : error ? (
        <p className="placeholder-panel p-4" role="alert">{error}</p>
      ) : colecciones.length === 0 ? (
        <section className="collections-empty placeholder-panel p-4 p-md-5">
          <span className="collections-empty-mark" aria-hidden="true">◇</span>
          <h2 className="h4">Todavía no tenés colecciones</h2>
          <p className="secondary-text mb-0">Creá tu primera colección con el formulario de arriba.</p>
        </section>
      ) : (
        <div className="collections-grid row g-4">
          {colecciones.map((coleccion) => (
            <div className="col-12 col-md-6 col-xl-4" key={coleccion.id}>
              <CollectionCard coleccion={coleccion} juegos={juegos} cargandoJuegos={cargandoJuegos}
                idsBiblioteca={idsBiblioteca} cargandoBiblioteca={cargandoBiblioteca} errorBiblioteca={errorBiblioteca}
                errorJuegos={errorJuegos} onActualizar={actualizarLocal} onEliminar={eliminarLocal} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default CollectionsPage
