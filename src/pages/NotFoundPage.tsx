import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

function NotFoundPage() {
  return (
    <section className="placeholder-panel p-4 p-md-5">
      <PageHeader title="404 — Página no encontrada" description="La dirección que visitaste no corresponde a una página de MyGameSearcher." />
      <Link className="btn btn-primary" to="/">Volver al inicio</Link>
    </section>
  )
}
export default NotFoundPage
