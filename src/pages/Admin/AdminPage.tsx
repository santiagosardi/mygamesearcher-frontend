import PageHeader from '../../components/PageHeader'
import { Link } from 'react-router-dom'

const secciones = [
  { titulo: 'Juegos', descripcion: 'Administrá los juegos del catálogo.' },
  { titulo: 'Géneros', descripcion: 'Administrá los géneros disponibles.' },
  { titulo: 'Plataformas', descripcion: 'Administrá las plataformas disponibles.' },
  { titulo: 'Características', descripcion: 'Administrá las características de los juegos.' },
]

function AdminPage() {
  return (
    <>
      <PageHeader title="Panel de administración" description="Gestioná el catálogo y sus atributos." />
      <div className="row g-3">
        {secciones.map(({ titulo, descripcion }) => (
          <div className="col-12 col-md-6" key={titulo}>
            <section className="placeholder-panel h-100 p-4">
              <h2 className="h4">{titulo}</h2>
              <p className="secondary-text">{descripcion}</p>
              {titulo === 'Juegos' ? <Link className="btn btn-outline-secondary" to="/admin/juegos">Gestionar juegos</Link>
                : <span className="status-label">Gestión próximamente</span>}
            </section>
          </div>
        ))}
      </div>
    </>
  )
}

export default AdminPage
