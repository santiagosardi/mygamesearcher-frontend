import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import PageHeader from '../../components/PageHeader'
import { register } from '../../services/auth.service'
import registerArtwork from '../../assets/auth/register-characters.webp'

function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [visible, setVisible] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enCurso = useRef(false)
  const montado = useRef(false)

  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enCurso.current) return
    setError(null)
    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()
    const emailLimpio = email.trim().toLowerCase()
    if (!nombreLimpio || nombreLimpio.length > 100 || apellidoLimpio.length > 100) {
      setError('El nombre es obligatorio. Nombre y apellido admiten hasta 100 caracteres.'); return
    }
    if (emailLimpio.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setError('Ingresá un email válido de hasta 254 caracteres.'); return
    }
    if (Array.from(password).length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirmacion) { setError('Las contraseñas no coinciden.'); return }
    enCurso.current = true
    setEnviando(true)
    try {
      await register({ nombre: nombreLimpio, ...(apellidoLimpio ? { apellido: apellidoLimpio } : {}), email: emailLimpio, password })
      if (!montado.current) return
      setPassword('')
      setConfirmacion('')
      navigate('/login', { replace: true, state: { registroExitoso: true } })
    } catch (error) {
      if (!montado.current) return
      setError(isAxiosError(error) && error.response?.status === 409
        ? 'Este email ya está registrado. Iniciá sesión o utilizá otro email.'
        : isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el servidor. Intentá nuevamente.'
          : isAxiosError(error) && error.response?.status === 400
            ? 'El servidor rechazó los datos. Revisá el email y los campos; la contraseña debe tener al menos 8 caracteres.'
            : 'No pudimos crear tu cuenta. Intentá nuevamente más tarde.')
    } finally {
      enCurso.current = false
      if (montado.current) setEnviando(false)
    }
  }

  if (isLoading) return <p role="status">Verificando sesión…</p>
  if (isAuthenticated) return <Navigate to="/catalogo" replace />
  return (
    <div className="register-page">
      <div className="register-content">
        <PageHeader title="Crear cuenta" description="Registrate para organizar tu biblioteca y tus colecciones." />
        <form className="register-form placeholder-panel p-4" onSubmit={(event) => void enviar(event)}>
          <fieldset disabled={enviando}>
            <legend className="visually-hidden">Datos de registro</legend>
            <div className="register-field-row">
              <div>
                <label className="form-label" htmlFor="registro-nombre">Nombre</label>
                <input className="form-control catalog-search mb-3" id="registro-nombre" autoComplete="given-name" required maxLength={100}
                  value={nombre} onChange={(event) => setNombre(event.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="registro-apellido">Apellido (opcional)</label>
                <input className="form-control catalog-search mb-3" id="registro-apellido" autoComplete="family-name" maxLength={100}
                  value={apellido} onChange={(event) => setApellido(event.target.value)} />
              </div>
            </div>
            <label className="form-label" htmlFor="registro-email">Email</label>
            <input className="form-control catalog-search mb-3" id="registro-email" type="email" autoComplete="email" required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)} />
            <div className="register-field-row">
              <div>
                <label className="form-label" htmlFor="registro-password">Contraseña</label>
                <input className="form-control catalog-search" id="registro-password" type={visible ? 'text' : 'password'} autoComplete="new-password" required
                  aria-describedby="registro-password-ayuda" value={password} onChange={(event) => setPassword(event.target.value)} />
                <p className="secondary-text small mt-1" id="registro-password-ayuda">Al menos 8 caracteres.</p>
              </div>
              <div>
                <label className="form-label" htmlFor="registro-confirmacion">Confirmar contraseña</label>
                <input className="form-control catalog-search mb-3" id="registro-confirmacion" type={visible ? 'text' : 'password'} autoComplete="new-password" required
                  value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} />
              </div>
            </div>
            <button className="btn btn-outline-secondary btn-sm mb-3" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>
              {visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            </button>
            <button className="btn btn-primary w-100" type="submit">{enviando ? 'Creando cuenta...' : 'Crear cuenta'}</button>
          </fieldset>
          {enviando && <p className="mt-3 mb-0" role="status">Registrando tu cuenta…</p>}
          {error && <p className="mt-3 mb-0" role="alert">{error}</p>}
        </form>
        <p className="register-login-link mt-3"><Link to="/login">¿Ya tenés cuenta? Iniciá sesión</Link></p>
      </div>
      <div className="register-artwork" aria-hidden="true">
        <img src={registerArtwork} alt="" decoding="async" />
      </div>
    </div>
  )
}

export default RegisterPage
