import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/biblioteca', label: 'Mi biblioteca' },
  { to: '/colecciones', label: 'Colecciones' },
  { to: '/recomendaciones', label: 'Recomendaciones' },
]

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
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
        </div>
      </div>
    </nav>
  )
}
export default Navbar
