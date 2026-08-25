import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../../apiConfig.js'

function OrderList() {
  let [orders, setOrders] = useState([])
  let [error, setError] = useState(null)

  useEffect(() => {
    let loadOrders = async () => {
      try {
        let response = await fetch(`${API_URL}/orders`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setOrders(data)
      } catch {
        setError('Kunde inte hämta ordrar.')
      }
    }

    loadOrders()
  }, [])

  return (
    <div className="admin-page">
      <h1>Ordrar</h1>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <Link to="/admin" className="btn">
          <span aria-hidden="true">←</span> Tillbaka
        </Link>
      </div>

      {!error && orders.length === 0 && <p>Inga ordrar ännu.</p>}

      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/admin/ordrar/${order.id}`}>
              <span>
                #{order.id} – {order.customer_name}
              </span>
              <span className="order-list-date">
                {new Date(order.created_at).toLocaleString('sv-SE')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OrderList
