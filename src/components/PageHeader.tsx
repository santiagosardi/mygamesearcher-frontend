type PageHeaderProps = { title: string; description: string }

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="page-header mb-4">
      <p className="eyebrow">MyGameSearcher</p>
      <h1>{title}</h1>
      <p className="page-description mb-0">{description}</p>
    </header>
  )
}
export default PageHeader
