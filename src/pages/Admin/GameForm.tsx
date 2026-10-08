import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ActualizarJuego, CrearJuego, Juego } from '../../types/juego'
import type { obtenerAtributos } from '../../services/atributos.service'

type Props = {
  juego?: Juego
  atributos: Awaited<ReturnType<typeof obtenerAtributos>>
  procesando: boolean
  onGuardar: (datos: CrearJuego | ActualizarJuego) => void
  onCancelar: () => void
}

function GameForm({ juego, atributos, procesando, onGuardar, onCancelar }: Props) {
  const [campos, setCampos] = useState({ titulo: juego?.titulo ?? '', descripcion: juego?.descripcion ?? '',
    desarrollador: juego?.desarrollador ?? '', fechaLanzamiento: juego?.fechaLanzamiento ?? '', urlImagen: juego?.urlImagen ?? '' })
  const [ids, setIds] = useState({ generoIds: juego?.generos.map((item) => item.id) ?? [],
    plataformaIds: juego?.plataformas.map((item) => item.id) ?? [], caracteristicaIds: juego?.caracteristicas.map((item) => item.id) ?? [] })
  const [error, setError] = useState<string | null>(null)
  const grupos = [
    { campo: 'generoIds', titulo: 'Géneros', opciones: atributos.generos, originales: juego?.generos },
    { campo: 'plataformaIds', titulo: 'Plataformas', opciones: atributos.plataformas, originales: juego?.plataformas },
    { campo: 'caracteristicaIds', titulo: 'Características', opciones: atributos.caracteristicas, originales: juego?.caracteristicas },
  ] as const

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!campos.titulo.trim() || campos.titulo.trim().length > 255) { setError('El título es obligatorio y admite hasta 255 caracteres.'); return }
    if (campos.desarrollador.trim().length > 255 || campos.urlImagen.trim().length > 2048) { setError('Desarrollador admite 255 caracteres y URL de imagen 2048.'); return }
    if (campos.urlImagen.trim()) {
      try {
        const url = new URL(campos.urlImagen.trim())
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      } catch { setError('Ingresá una URL de imagen válida con http:// o https://.'); return }
    }
    if (campos.fechaLanzamiento) {
      const fecha = new Date(`${campos.fechaLanzamiento}T00:00:00Z`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(campos.fechaLanzamiento) || Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== campos.fechaLanzamiento) {
        setError('Ingresá una fecha válida en formato año-mes-día.'); return
      }
    }
    const datos: ActualizarJuego = {}
    for (const campo of Object.keys(campos) as (keyof typeof campos)[]) {
      const valor = campos[campo].trim()
      const original = juego?.[campo] ?? ''
      if (juego && valor === original) continue
      if (campo === 'fechaLanzamiento' || campo === 'urlImagen') {
        if (!valor && original) { setError('El backend no permite vaciar una fecha o URL existente. Conservá el valor o ingresá otro válido.'); return }
        if (!valor) continue
      }
      datos[campo] = valor
    }
    for (const grupo of grupos) {
      const seleccionados = [...new Set(ids[grupo.campo])].sort((a, b) => a - b)
      const anteriores = grupo.originales?.map((item) => item.id).sort((a, b) => a - b)
      if (!juego || JSON.stringify(seleccionados) !== JSON.stringify(anteriores)) datos[grupo.campo] = seleccionados
    }
    if (!Object.keys(datos).length) { setError('No hay cambios para guardar.'); return }
    onGuardar(juego ? datos : { ...datos, titulo: campos.titulo.trim() })
  }

  return (
    <form className="placeholder-panel p-4 mb-4" onSubmit={enviar}>
      <h2 className="h4">{juego ? `Editar ${juego.titulo}` : 'Crear juego'}</h2>
      <fieldset disabled={procesando}>
        <legend className="visually-hidden">Datos del juego</legend>
        <div className="row g-3">
          {([
            ['titulo', 'Título', 'text', 255], ['desarrollador', 'Desarrollador', 'text', 255],
            ['fechaLanzamiento', 'Fecha de lanzamiento', 'date', undefined], ['urlImagen', 'URL de imagen', 'url', 2048],
          ] as const).map(([campo, etiqueta, tipo, limite]) => (
            <div className="col-12 col-md-6" key={campo}>
              <label className="form-label" htmlFor={`juego-${campo}`}>{etiqueta}{campo !== 'titulo' && ' (opcional)'}</label>
              <input className="form-control catalog-search" id={`juego-${campo}`} type={tipo} required={campo === 'titulo'} maxLength={limite}
                value={campos[campo]} onChange={(event) => setCampos({ ...campos, [campo]: event.target.value })} />
            </div>
          ))}
          <div className="col-12">
            <label className="form-label" htmlFor="juego-descripcion">Descripción (opcional)</label>
            <textarea className="form-control catalog-search" id="juego-descripcion" rows={3} value={campos.descripcion}
              onChange={(event) => setCampos({ ...campos, descripcion: event.target.value })} />
          </div>
          {grupos.map((grupo) => (
            <div className="col-12 col-md-4" key={grupo.campo}>
              <fieldset>
                <legend className="h6">{grupo.titulo}</legend>
                <div className="collection-game-list">
                  {grupo.opciones.length === 0 && <p className="secondary-text small">No hay opciones disponibles.</p>}
                  {grupo.opciones.map((opcion) => (
                    <div className="form-check" key={opcion.id}>
                      <input className="form-check-input" type="checkbox" id={`${grupo.campo}-${opcion.id}`} checked={ids[grupo.campo].includes(opcion.id)}
                        onChange={(event) => setIds({ ...ids, [grupo.campo]: event.target.checked ? [...ids[grupo.campo], opcion.id] : ids[grupo.campo].filter((id) => id !== opcion.id) })} />
                      <label className="form-check-label text-break" htmlFor={`${grupo.campo}-${opcion.id}`}>{opcion.nombre}</label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          ))}
        </div>
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-primary" type="submit">{procesando ? 'Guardando...' : 'Guardar juego'}</button>
          <button className="btn btn-outline-secondary" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
      </fieldset>
      {error && <p className="mt-3 mb-0" role="alert">{error}</p>}
    </form>
  )
}

export default GameForm
