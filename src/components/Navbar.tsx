import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const navigation = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/biblioteca', label: 'Mi biblioteca' },
  { to: '/colecciones', label: 'Colecciones' },
  { to: '/recomendaciones', label: 'Recomendaciones' },
]

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <nav className="navbar navbar-expand-lg app-navbar" aria-label="Navegación principal" data-bs-theme="dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={() => setIsOpen(false)}>
          <span className="brand-mark" aria-hidden="true">M</span>MyGameSearcher
        </Link>
        <button className="navbar-toggler" type="button" aria-controls="main-navigation"
          aria-expanded={isOpen} aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsOpen(!isOpen)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={'collapse navbar-collapse' + (isOpen ? ' show' : '')} id="main-navigation">
          <ul className="navbar-nav ms-auto gap-lg-1">
            {navigation.map(({ to, label }) => (
              <li className="nav-item" key={to}>
                <NavLink className="nav-link" to={to} end onClick={() => setIsOpen(false)}>{label}</NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex flex-wrap align-items-center gap-2 mt-3 mt-lg-0 ms-lg-3">
            {isLoading ? <span className="secondary-text small" role="status">Verificando sesión…</span>
              : user ? <>
                <span className="secondary-text small text-break">Hola, {user.nombre}</span>
                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => {
                  logout()
                  setIsOpen(false)
                  navigate('/login', { replace: true })
                }}>Cerrar sesión</button>
              </> : <Link className="btn btn-outline-secondary btn-sm" to="/login" onClick={() => setIsOpen(false)}>Iniciar sesión</Link>}
          </div>
        </div>
      </div>
    </nav>
  )
}
export default Navbar
