import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/Home/HomePage'
import CatalogPage from './pages/Catalog/CatalogPage'
import LibraryPage from './pages/Library/LibraryPage'
import CollectionsPage from './pages/Collections/CollectionsPage'
import RecommendationsPage from './pages/Recommendations/RecommendationsPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/Login/LoginPage'
import RegisterPage from './pages/Register/RegisterPage'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminPage from './pages/Admin/AdminPage'
import AdminGamesPage from './pages/Admin/AdminGamesPage'
import AdminAttributesPage from './pages/Admin/AdminAttributesPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="biblioteca" element={<LibraryPage />} />
          <Route path="colecciones" element={<CollectionsPage />} />
          <Route path="recomendaciones" element={<RecommendationsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/juegos" element={<AdminGamesPage />} />
          <Route path="admin/generos" element={<AdminAttributesPage key="generos" tipo="generos" />} />
          <Route path="admin/plataformas" element={<AdminAttributesPage key="plataformas" tipo="plataformas" />} />
          <Route path="admin/caracteristicas" element={<AdminAttributesPage key="caracteristicas" tipo="caracteristicas" />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
export default App
