import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import NavBar from './NavBar.jsx'

const STATUS_TEXT = { pending: 'Väntar på betalningen…', paid: 'Betald', cancelled: 'Avbruten' }

function ThankYou() {
  let [searchParams] = useSearchParams()
  let sessionId = searchParams.get('session_id')
  let { clearCart } = useCart()
  let [order, setOrder] = useState(null)
  let [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    let tries = 0
    let timer

    let loadOrder = async () => {
      try {
        let response = await fetch(`${API_URL}/checkout/session/${encodeURIComponent(sessionId)}`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setOrder(data)
        tries += 1
        if (data.status === 'pending' && tries < 15) timer = setTimeout(loadOrder, 2000)
      } catch {
        setError('Kunde inte hämta ordern.')
      }
    }

    loadOrder()
    return () => clearTimeout(timer)
  }, [sessionId])

  useEffect(() => {
    if (order?.status === 'paid') clearCart()
  }, [order?.status])

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <div className="shop-thankyou">
          {error && <p className="shop-error">{error}</p>}
          {order && (
            <div className="shop-order-summary">
              <h3>Order {order.id}: {STATUS_TEXT[order.status]}</h3>
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
                    <span>
                      {order.shipping_method === 'pickup_point' ? 'Frakt: ombud' : 'Frakt: hemleverans'}
                      {order.shipping_method === 'pickup_point' && (
                        <>
                          <br />
                          {order.pickup_point_name}
                          {order.pickup_point_address && `, ${order.pickup_point_address}`}
                        </>
                      )}
                    </span>
                    <span>{Number(order.shipping_price) === 0 ? 'Fri frakt' : `${Number(order.shipping_price)} kr`}</span>
                  </li>
                )}
              </ul>
              <p className="shop-order-total">
                Totalt: <strong>{Number(order.total)} kr</strong>
              </p>
            </div>
          )}
          <Link to="/" className="shop-btn shop-btn-primary">
            Fortsätt handla
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ThankYou
