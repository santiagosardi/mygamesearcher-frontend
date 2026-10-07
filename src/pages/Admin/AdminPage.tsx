import PageHeader from '../../components/PageHeader'
import { Link } from 'react-router-dom'

const secciones = [
  { titulo: 'Juegos', descripcion: 'Administrá los juegos del catálogo.', ruta: 'juegos' },
  { titulo: 'Géneros', descripcion: 'Administrá los géneros disponibles.', ruta: 'generos' },
  { titulo: 'Plataformas', descripcion: 'Administrá las plataformas disponibles.', ruta: 'plataformas' },
  { titulo: 'Características', descripcion: 'Administrá las características de los juegos.', ruta: 'caracteristicas' },
]

function AdminPage() {
  return (
    <div className="admin-overview">
      <div className="admin-overview-header mb-4">
        <PageHeader title="Panel de administración" description="Gestioná el catálogo y sus atributos." />
      </div>
      <div className="row g-4">
        {secciones.map(({ titulo, descripcion, ruta }) => (
          <div className="col-12 col-md-6" key={titulo}>
            <section className="admin-access-card placeholder-panel h-100 p-4">
              <h2 className="h4">{titulo}</h2>
              <p className="secondary-text">{descripcion}</p>
              <Link className="admin-access-button btn btn-outline-secondary" to={`/admin/${ruta}`}>Gestionar {titulo.toLowerCase()}</Link>
            </section>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPage
