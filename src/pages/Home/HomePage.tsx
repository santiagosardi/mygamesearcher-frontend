import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import heroImage from '../../assets/hero-characters.webp'
import catalogImage from '../../assets/home-cards/catalog-rabbid.webp'
import libraryImage from '../../assets/home-cards/library-panther.webp'
import collectionsImage from '../../assets/home-cards/collections-hollow.webp'
import recommendationsImage from '../../assets/home-cards/recommendations-group.webp'

const sections = [
  {
    to: '/catalogo',
    number: '01',
    image: catalogImage,
    variant: 'catalog',
    title: 'Catálogo',
    description: 'Explorá videojuegos y encontrá tu próxima aventura.',
  },
  {
    to: '/biblioteca',
    number: '02',
    image: libraryImage,
    variant: 'library',
    title: 'Mi biblioteca',
    description: 'Reuní tus juegos y organizá lo que querés jugar.',
  },
  {
    to: '/colecciones',
    number: '03',
    image: collectionsImage,
    variant: 'collections',
    title: 'Colecciones',
    description: 'Agrupá tus juegos por género, temática o tus propios criterios.',
  },
  {
    to: '/recomendaciones',
    number: '04',
    image: recommendationsImage,
    variant: 'recommendations',
    title: 'Recomendaciones',
    description: 'Descubrí propuestas relacionadas con tus intereses.',
  },
]

function HomePage() {
  return (
    <>
      <section className="home-hero p-4 p-md-5 mb-5">
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-7">
            <div className="hero-copy">
              <PageHeader
  title="Tus gustos. Tu próximo juego."
  description="Organizá tus juegos, armá tus colecciones y recibí recomendaciones basadas en lo que realmente te gusta."
/>

              <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-start">
<Link className="btn btn-primary px-4" to="/recomendaciones">
  Ver mis recomendaciones
</Link>

<Link className="btn btn-outline-secondary px-4" to="/catalogo">
  Explorar catálogo
</Link>
              </div>

              <div className="hero-stats mt-5">
  <div className="hero-stat">
    <strong>PERSONALIZADAS</strong>
    <span>Recomendaciones según tus gustos</span>
  </div>

  <div className="hero-stat">
    <strong>INTELIGENTES</strong>
    <span>Basadas en géneros, características y plataformas</span>
  </div>

  <div className="hero-stat">
    <strong>PARA VOS</strong>
    <span>Tu biblioteca y colecciones mejoran cada resultado</span>
  </div>
</div>
            </div>
          </div>

          <div className="col-lg-5 d-none d-lg-flex justify-content-center">
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-visual-glow" />

              <div className="hero-visual-main">
                <img src={heroImage} alt="" />
              </div>

              <div className="hero-floating-card hero-floating-card-top">
                <span>DESCUBRÍ</span>
                <strong>Nuevos juegos</strong>
              </div>

              <div className="hero-floating-card hero-floating-card-bottom">
                <span>ORGANIZÁ</span>
                <strong>Tu biblioteca</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-sections" aria-labelledby="sections-title">
        <div className="section-heading home-section-heading mb-4">
          <div>
            <p className="eyebrow home-section-eyebrow mb-2">
              <span className="home-eyebrow-word home-eyebrow-discover">DESCUBRÍ</span>{' '}
              <span className="home-eyebrow-separator">·</span>{' '}
              <span className="home-eyebrow-word home-eyebrow-organize">ORGANIZÁ</span>{' '}
              <span className="home-eyebrow-separator">·</span>{' '}
              <span className="home-eyebrow-word home-eyebrow-play">JUGÁ</span>
            </p>
            <h2 className="mb-1" id="sections-title">
              Explorá <span className="home-section-title-accent">MyGameSearcher</span>
            </h2>
          </div>

          <p className="secondary-text mb-0">
            Todo lo que necesitás para ordenar, descubrir y elegir qué jugar.
          </p>
        </div>

        <div className="row g-3">
          {sections.map(({ to, number, title, description, image, variant }) => (
            <div className="col-12 col-md-6 col-xl-3" key={to}>
              <Link className={`section-card home-feature-card home-feature-card-${variant} h-100`} to={to}>
                <div className="home-feature-art" aria-hidden="true">
                  <img src={image} alt="" loading="lazy" decoding="async" width={1254} height={1254} />
                </div>
                <span className="section-card-number" aria-hidden="true">{number}</span>
                <div className="home-feature-content">
                  <h3>{title}</h3>
                  <p className="secondary-text mb-0">{description}</p>
                  <span className="home-feature-entry" aria-hidden="true">Explorar <span>↗</span></span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default HomePage
