import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import NavBar from './NavBar.jsx'

const STATUS_TEXT = { pending: 'Inte betald', paid: 'Betald', cancelled: 'Avbruten' }

function MyPages() {
  let navigate = useNavigate()
  let [customer, setCustomer] = useState(null)
  let [orders, setOrders] = useState(null)
  let [loggedOut, setLoggedOut] = useState(false)
  let [error, setError] = useState(null)

  useEffect(() => {
    let load = async () => {
      try {
        let meResponse = await fetch(`${API_URL}/auth/me`)
        if (meResponse.status === 401) {
          setLoggedOut(true)
          return
        }
        if (!meResponse.ok) throw new Error()
        setCustomer(await meResponse.json())

        let ordersResponse = await fetch(`${API_URL}/account/orders`)
        if (!ordersResponse.ok) throw new Error()
        setOrders(await ordersResponse.json())
      } catch {
        setError('Kunde inte hämta dina beställningar.')
      }
    }
    load()
  }, [])

  let logout = async () => {
    try {
      let response = await fetch(`${API_URL}/auth/logout`, { method: 'POST' })
      if (!response.ok) throw new Error()
      navigate('/')
    } catch {
      setError('Kunde inte logga ut. Försök igen.')
    }
  }

  if (loggedOut) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <h2>Mina sidor</h2>
          <p>Du måste logga in för att se dina beställningar.</p>
          <Link to="/inloggning" className="shop-btn shop-btn-primary">
            Logga in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <h2>Mina sidor</h2>
        {customer && (
          <p>
            Inloggad som {customer.name ?? customer.email} ({customer.email}){' '}
            <button type="button" className="shop-btn shop-btn-sm" onClick={logout}>
              Logga ut
            </button>
          </p>
        )}
        {error && <p className="shop-error">{error}</p>}
        {orders && orders.length === 0 && <p>Du har inga beställningar än.</p>}
        {orders && orders.length > 0 && (
          <div className="shop-account-orders">
            {orders.map((order) => (
              <div key={order.id} className="shop-order-summary">
                <h3>
                  Order {order.id}, {new Date(order.created_at).toLocaleDateString('sv-SE')}: {STATUS_TEXT[order.status]}
                </h3>
                <ul>
                  {order.items.map((item) => (
                    <li key={item.product_id}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{Number(item.price_at_purchase) * item.quantity} kr</span>
                    </li>
                  ))}
                  {order.shipping_method != null && order.shipping_price != null && (
                    <li>
                      <span>{order.shipping_method === 'pickup_point' ? 'Frakt: ombud' : 'Frakt: hemleverans'}</span>
                      <span>{Number(order.shipping_price) === 0 ? 'Fri frakt' : `${Number(order.shipping_price)} kr`}</span>
                    </li>
                  )}
                </ul>
                <p className="shop-order-total">
                  Totalt: <strong>{Number(order.total)} kr</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPages
