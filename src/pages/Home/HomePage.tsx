import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'

const sections = [
  { to: '/catalogo', title: 'Catálogo', description: 'Explorá videojuegos y encontrá tu próxima aventura.' },
  { to: '/biblioteca', title: 'Mi biblioteca', description: 'Reuní tus juegos y organizá lo que querés jugar.' },
  { to: '/colecciones', title: 'Colecciones', description: 'Agrupá tus juegos por género, temática o tus propios criterios.' },
  { to: '/recomendaciones', title: 'Recomendaciones', description: 'Descubrí propuestas relacionadas con tus intereses.' },
]

function HomePage() {
  return (
    <>
      <section className="home-hero p-4 p-md-5 mb-4">
        <PageHeader title="Tus juegos. Tu espacio." description="Organizá tu biblioteca personal de videojuegos y elegí qué jugar después." />
        <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-start">
          <Link className="btn btn-primary" to="/biblioteca">Explorar mi biblioteca</Link>
          <Link className="btn btn-outline-secondary" to="/catalogo">Ir al catálogo</Link>
        </div>
      </section>
      <section aria-labelledby="sections-title">
        <h2 className="h4 mb-3" id="sections-title">Explorá MyGameSearcher</h2>
        <div className="row g-3">
          {sections.map(({ to, title, description }) => (
            <div className="col-12 col-md-6" key={to}>
              <Link className="section-card h-100 p-4" to={to}>
                <h3 className="h5">{title}<span aria-hidden="true">→</span></h3>
                <p className="secondary-text mb-0">{description}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
export default HomePage
