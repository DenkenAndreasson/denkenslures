import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'
import NavBar from './NavBar.jsx'

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null

function Checkout() {
  let { items, total } = useCart()
  let { formatPrice } = useCurrency()
  let [error, setError] = useState(null)
  let [submitting, setSubmitting] = useState(false)
  let [clientSecret, setClientSecret] = useState(null)

  let handleSubmit = async (e) => {
    e.preventDefault()
    let form = e.target.elements
    setSubmitting(true)
    setError(null)

    let order = {
      customer_name: form.customer_name.value,
      customer_email: form.customer_email.value,
      address: form.address.value,
      postal_code: form.postal_code.value,
      city: form.city.value,
      items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    }

    try {
      let response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      let data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error)

      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err.message || 'Kunde inte starta betalningen. Försök igen.')
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

        {!stripePromise && (
          <p className="shop-error">Betalningen är inte konfigurerad (VITE_STRIPE_PUBLISHABLE_KEY saknas).</p>
        )}

        <div className="shop-checkout">
          {clientSecret ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
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

              <button type="submit" className="shop-btn shop-btn-primary" disabled={submitting || !stripePromise}>
                {submitting ? 'Skickar...' : 'Gå till betalning'}
              </button>
            </form>
          )}

          <div className="shop-order-summary">
            <h3>Din beställning</h3>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="shop-order-total">
              Totalt: <strong>{formatPrice(total)}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
