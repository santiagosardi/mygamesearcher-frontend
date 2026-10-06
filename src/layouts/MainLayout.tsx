import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

function MainLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <Navbar />
      <main className="container py-4 py-md-5 flex-grow-1" id="main-content" tabIndex={-1}><Outlet /></main>
      <footer className="app-footer">
        <div className="container py-3 d-flex flex-column flex-sm-row justify-content-between gap-2">
          <span>MyGameSearcher</span><span>Tu espacio para organizar videojuegos.</span>
        </div>
      </footer>
    </div>
  )
}
export default MainLayout
