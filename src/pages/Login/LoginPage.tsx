import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/useAuth'

function LoginPage() {
  const { login, isAuthenticated, isLoading, sessionError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enCurso = useRef(false)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enCurso.current) return
    enCurso.current = true
    setEnviando(true)
    setError(null)
    try {
      await login({ email: email.trim().toLowerCase(), password })
      setPassword('')
      navigate('/catalogo', { replace: true })
    } catch (error) {
      setError(isAxiosError(error) && error.response?.status === 401
        ? 'Email o contraseña incorrectos.'
        : isAxiosError(error) && !error.response
          ? 'No pudimos conectar con el servidor. Intentá nuevamente.'
          : 'No pudimos iniciar sesión. Intentá nuevamente.')
    } finally {
      enCurso.current = false
      setEnviando(false)
    }
  }

  if (isLoading) return <p role="status">Verificando sesión…</p>
  if (isAuthenticated) return <Navigate to="/catalogo" replace />
  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <PageHeader title="Iniciar sesión" description="Ingresá para acceder a tus espacios personales." />
        {location.state?.registroExitoso === true && <p className="placeholder-panel p-3" role="status">Tu cuenta se creó correctamente. Ya podés iniciar sesión.</p>}
        {sessionError && <p role="alert">{sessionError}</p>}
        <form className="placeholder-panel p-4" onSubmit={(event) => void enviar(event)}>
          <fieldset disabled={enviando}>
            <legend className="visually-hidden">Credenciales de acceso</legend>
            <label className="form-label" htmlFor="login-email">Email</label>
            <input className="form-control catalog-search mb-3" id="login-email" type="email" autoComplete="username"
              required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input className="form-control catalog-search mb-3" id="login-password" type="password" autoComplete="current-password"
              required value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="btn btn-primary w-100" type="submit">{enviando ? 'Iniciando sesión...' : 'Iniciar sesión'}</button>
          </fieldset>
          {error && <p className="mt-3 mb-0" role="alert">{error}</p>}
        </form>
        <p className="mt-3"><Link to="/registro">¿No tenés cuenta? Registrate</Link></p>
      </div>
    </div>
  )
}

export default LoginPage
