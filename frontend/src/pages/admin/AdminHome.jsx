import { Link } from 'react-router-dom'

function AdminHome() {
  return (
    <div className="admin-page">
      <h1>Admin</h1>

      <nav className="admin-nav">
        <Link to="/admin/produkter" className="admin-nav-card">
          <span>Produkter</span>
          <span className="admin-nav-card-desc">Hantera produkter i butiken</span>
        </Link>
        <Link to="/admin/ordrar" className="admin-nav-card">
          <span>Ordrar</span>
          <span className="admin-nav-card-desc">Se inkomna beställningar</span>
        </Link>
      </nav>
    </div>
  )
}

export default AdminHome
