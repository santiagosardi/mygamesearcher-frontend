import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading) return <p className="placeholder-panel p-4 secondary-text" role="status">Verificando sesión…</p>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
