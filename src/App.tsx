import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/Home/HomePage'
import CatalogPage from './pages/Catalog/CatalogPage'
import LibraryPage from './pages/Library/LibraryPage'
import CollectionsPage from './pages/Collections/CollectionsPage'
import RecommendationsPage from './pages/Recommendations/RecommendationsPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/Login/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalogo" element={<CatalogPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="biblioteca" element={<LibraryPage />} />
          <Route path="colecciones" element={<CollectionsPage />} />
          <Route path="recomendaciones" element={<RecommendationsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
export default App
