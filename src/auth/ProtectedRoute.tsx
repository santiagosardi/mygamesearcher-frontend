import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { AuthUser } from '../types/auth'
import PageHeader from '../components/PageHeader'

function ProtectedRoute({ roles }: { roles?: AuthUser['rol'][] }) {
  const { isLoading, isAuthenticated, user } = useAuth()
  if (isLoading) return <p className="placeholder-panel p-4 secondary-text" role="status">Verificando sesión…</p>
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) {
    return (
      <section className="placeholder-panel p-4 p-md-5">
        <PageHeader title="Acceso denegado" description="Tu cuenta no tiene permiso para acceder a esta sección." />
        <Link className="btn btn-outline-secondary" to="/catalogo">Volver al catálogo</Link>
      </section>
    )
  }
  return <Outlet />
}

export default ProtectedRoute
