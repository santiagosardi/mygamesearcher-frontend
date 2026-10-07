import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import PageHeader from '../../components/PageHeader'
import { listarAtributos, crearAtributo, actualizarAtributo, eliminarAtributo } from '../../services/atributos.service'
import type { Atributo, ActualizarAtributo, TipoAtributo } from '../../services/atributos.service'
import { errorAdmin } from './errorAdmin'

const etiquetas = {
  generos: { plural: 'géneros', singular: 'género' },
  plataformas: { plural: 'plataformas', singular: 'plataforma' },
  caracteristicas: { plural: 'características', singular: 'característica' },
}

function AdminAttributesPage({ tipo }: { tipo: TipoAtributo }) {
  const etiqueta = etiquetas[tipo]
  const [atributos, setAtributos] = useState<Atributo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [formulario, setFormulario] = useState<Atributo | 'nuevo' | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const enCurso = useRef(false)
  const montado = useRef(false)

  useEffect(() => {
    let activo = true
    montado.current = true
    void listarAtributos(tipo).then((datos) => { if (activo) setAtributos(datos) })
      .catch((error) => { if (activo) setErrorCarga(errorAdmin(error)) })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false; montado.current = false }
  }, [tipo])

  function abrirFormulario(atributo: Atributo | 'nuevo') {
    if (enCurso.current) return
    setFormulario(atributo)
    setNombre(atributo === 'nuevo' ? '' : atributo.nombre)
    setDescripcion(atributo === 'nuevo' ? '' : atributo.descripcion ?? '')
    setMensaje(null)
  }

  function describirError(error: unknown) {
    if (isAxiosError(error) && error.response?.status === 409) return 'Ya existe un atributo con ese nombre o hay una restricción con juegos relacionados.'
    return errorAdmin(error)
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enCurso.current || !formulario) return
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) { setMensaje({ texto: 'El nombre es obligatorio y no puede contener solo espacios.', error: true }); return }
    const datos: ActualizarAtributo = {}
    if (formulario === 'nuevo' || nombreLimpio !== formulario.nombre) datos.nombre = nombreLimpio
    if (formulario === 'nuevo' || descripcion.trim() !== (formulario.descripcion ?? '')) datos.descripcion = descripcion.trim()
    if (!Object.keys(datos).length) { setMensaje({ texto: 'No hay cambios para guardar.', error: false }); return }
    enCurso.current = true
    setProcesando(true)
    setMensaje(null)
    try {
      const nuevo = formulario === 'nuevo'
      const guardado = nuevo
        ? await crearAtributo(tipo, { ...datos, nombre: nombreLimpio })
        : await actualizarAtributo(tipo, formulario.id, datos)
      if (!montado.current) return
      setAtributos((actuales) => nuevo ? [...actuales, guardado] : actuales.map((item) => item.id === guardado.id ? guardado : item))
      setFormulario(null)
      setBusqueda('')
      setMensaje({ texto: `Se ${nuevo ? 'creó' : 'actualizó'} "${guardado.nombre}".`, error: false })
    } catch (error) {
      if (montado.current) setMensaje({ texto: describirError(error), error: true })
    } finally {
      enCurso.current = false
      if (montado.current) setProcesando(false)
    }
  }

  async function eliminar(atributo: Atributo) {
    if (enCurso.current || !window.confirm(`¿Querés eliminar "${atributo.nombre}"? Puede estar relacionado con juegos y la eliminación puede quitar esas asociaciones. La operación no se puede deshacer.`)) return
    enCurso.current = true
    setProcesando(true)
    setMensaje(null)
    try {
      await eliminarAtributo(tipo, atributo.id)
      if (!montado.current) return
      setAtributos((actuales) => actuales.filter((item) => item.id !== atributo.id))
      setMensaje({ texto: `Se eliminó "${atributo.nombre}".`, error: false })
    } catch (error) {
      if (montado.current) setMensaje({ texto: describirError(error), error: true })
    } finally {
      enCurso.current = false
      if (montado.current) setProcesando(false)
    }
  }

  const visibles = atributos.filter((item) => item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  return (
    <>
      <PageHeader title={`Administrar ${etiqueta.plural}`} description="Gestioná los atributos disponibles para los juegos del catálogo." />
      <Link className="btn btn-outline-secondary mb-3" to="/admin">Volver al panel</Link>
      {mensaje && <p className="placeholder-panel p-3" role={mensaje.error ? 'alert' : 'status'}>{mensaje.texto}</p>}
      {procesando && <p className="secondary-text" role="status">Procesando…</p>}
      <div className="row g-3 align-items-end mb-4">
        <div className="col-12 col-md-8">
          <label className="form-label" htmlFor="buscar-atributo">Buscar por nombre</label>
          <input className="form-control catalog-search" id="buscar-atributo" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
        </div>
        <div className="col-12 col-md-4">
          <button className="btn btn-primary w-100" type="button" disabled={procesando || cargando || Boolean(errorCarga) || formulario !== null}
            onClick={() => abrirFormulario('nuevo')}>Crear {etiqueta.singular}</button>
        </div>
      </div>
      {formulario && <form className="placeholder-panel p-4 mb-4" onSubmit={(event) => void guardar(event)}>
        <h2 className="h4">{formulario === 'nuevo' ? 'Crear' : 'Editar'} {etiqueta.singular}</h2>
        <fieldset disabled={procesando}>
          <legend className="visually-hidden">Datos del atributo</legend>
          <label className="form-label" htmlFor="nombre-atributo">Nombre</label>
          <input className="form-control catalog-search mb-3" id="nombre-atributo" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
          <label className="form-label" htmlFor="descripcion-atributo">Descripción (opcional)</label>
          <textarea className="form-control catalog-search" id="descripcion-atributo" rows={3} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary" type="submit">{procesando ? 'Guardando...' : 'Guardar'}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => { setFormulario(null); setMensaje(null) }}>Cancelar</button>
          </div>
        </fieldset>
      </form>}
      {cargando ? <p role="status">Cargando {etiqueta.plural}…</p>
        : errorCarga ? <p role="alert">{errorCarga}</p>
          : atributos.length === 0 ? <p className="placeholder-panel p-4">Todavía no hay {etiqueta.plural}.</p>
            : visibles.length === 0 ? <p role="status">No se encontraron resultados con esa búsqueda.</p>
              : <div className="row g-3">
                {visibles.map((atributo) => <div className="col-12 col-md-6 col-xl-4" key={atributo.id}>
                  <article className="placeholder-panel h-100 p-4 text-break">
                    <h2 className="h4">{atributo.nombre}</h2>
                    {atributo.descripcion && <p className="secondary-text">{atributo.descripcion}</p>}
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-outline-secondary" type="button" disabled={procesando || formulario !== null} onClick={() => abrirFormulario(atributo)}>Editar</button>
                      <button className="btn btn-outline-secondary" type="button" disabled={procesando || formulario !== null} onClick={() => void eliminar(atributo)}>Eliminar</button>
                    </div>
                  </article>
                </div>)}
              </div>}
    </>
  )
}

export default AdminAttributesPage
