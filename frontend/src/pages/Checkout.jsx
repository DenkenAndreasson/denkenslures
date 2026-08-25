import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import NavBar from './NavBar.jsx'

function Checkout() {
  let navigate = useNavigate()
  let { items, total, clearCart } = useCart()
  let [error, setError] = useState(null)
  let [submitting, setSubmitting] = useState(false)

  let handleSubmit = async (e) => {
    e.preventDefault()
    let form = e.target.elements
    setSubmitting(true)

    let order = {
      customer_name: form.customer_name.value,
      customer_email: form.customer_email.value,
      address: form.address.value,
      postal_code: form.postal_code.value,
      city: form.city.value,
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      })),
    }

    try {
      let response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      if (!response.ok) throw new Error()
      let createdOrder = await response.json()

      clearCart()
      navigate('/tack', { state: { orderId: createdOrder.id } })
    } catch {
      setError('Kunde inte skicka beställningen. Försök igen.')
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <h2>Kassa</h2>
          <p>Din varukorg är tom.</p>
          <Link to="/" className="shop-back-link">
            ‹ Till produkterna
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <Link to="/varukorg" className="shop-back-link">
          ‹ Tillbaka till varukorgen
        </Link>
        <h2>Kassa</h2>

        <div className="shop-checkout">
          <form className="shop-form" onSubmit={handleSubmit}>
            <label>
              Namn
              <input name="customer_name" type="text" required />
            </label>
            <label>
              E-post
              <input name="customer_email" type="email" required />
            </label>
            <label>
              Adress
              <input name="address" type="text" required />
            </label>
            <label>
              Postnummer
              <input name="postal_code" type="text" required />
            </label>
            <label>
              Ort
              <input name="city" type="text" required />
            </label>

            {error && <p className="shop-error">{error}</p>}

            <button type="submit" className="shop-btn shop-btn-primary" disabled={submitting}>
              {submitting ? 'Skickar...' : 'Slutför köp'}
            </button>
          </form>

          <div className="shop-order-summary">
            <h3>Din beställning</h3>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{item.price * item.quantity} kr</span>
                </li>
              ))}
            </ul>
            <p className="shop-order-total">
              Totalt: <strong>{total} kr</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
