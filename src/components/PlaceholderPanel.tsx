type PlaceholderPanelProps = { title: string; description: string }

function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <section className="placeholder-panel p-4 p-md-5">
      <span className="status-label">Próximamente</span>
      <h2 className="h4 mt-3">{title}</h2>
      <p className="secondary-text mb-0">{description}</p>
    </section>
  )
}
export default PlaceholderPanel
