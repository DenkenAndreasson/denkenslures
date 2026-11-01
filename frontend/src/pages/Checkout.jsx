import { useRef, useState } from 'react'
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
  let [postalCode, setPostalCode] = useState('')
  let [shippingQuote, setShippingQuote] = useState(null)
  let [shippingMethod, setShippingMethod] = useState(null)
  let [pickupPointId, setPickupPointId] = useState('')
  let [shippingLoading, setShippingLoading] = useState(false)
  let [shippingError, setShippingError] = useState(null)
  let quoteRequestId = useRef(0)
  let quoteController = useRef(null)
  let quotedPostalCode = useRef(null)

  let quoteShipping = async (value) => {
    let normalizedPostalCode = value.replace(' ', '')
    if (shippingQuote && quotedPostalCode.current === normalizedPostalCode) return

    let requestId = ++quoteRequestId.current
    quoteController.current?.abort()
    quoteController.current = null
    setShippingQuote(null)
    setShippingMethod(null)
    setPickupPointId('')
    setShippingError(null)

    if (!/^\d{3} ?\d{2}$/.test(value)) {
      setShippingLoading(false)
      setShippingError('Ange ett postnummer med fem siffror')
      return
    }

    let controller = new AbortController()
    quoteController.current = controller
    setShippingLoading(true)
    try {
      let response = await fetch(`${API_URL}/shipping/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postal_code: value,
          items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        }),
        signal: controller.signal,
      })
      let data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Kunde inte hämta fraktalternativ.')
      if (requestId === quoteRequestId.current) {
        setShippingQuote(data)
        quotedPostalCode.current = normalizedPostalCode
      }
    } catch (err) {
      if (requestId === quoteRequestId.current && err.name !== 'AbortError') {
        setShippingError(err.message || 'Kunde inte hämta fraktalternativ. Försök igen.')
      }
    } finally {
      if (requestId === quoteRequestId.current) {
        setShippingLoading(false)
        quoteController.current = null
      }
    }
  }

  let handlePostalCodeChange = (e) => {
    setPostalCode(e.target.value)
    quoteRequestId.current += 1
    quoteController.current?.abort()
    quoteController.current = null
    setShippingLoading(false)
    setShippingQuote(null)
    quotedPostalCode.current = null
    setShippingMethod(null)
    setPickupPointId('')
    setShippingError(null)
  }

  let handleSubmit = async (e) => {
    e.preventDefault()
    let form = e.target.elements
    if (!shippingQuote || !shippingMethod || (shippingMethod === 'pickup_point' && !pickupPointId)) return
    setSubmitting(true)
    setError(null)

    let order = {
      customer_name: form.customer_name.value,
      customer_email: form.customer_email.value,
      address: form.address.value,
      postal_code: postalCode,
      city: form.city.value,
      items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      shipping_method: shippingMethod,
    }
    if (shippingMethod === 'pickup_point') order.pickup_point_id = pickupPointId

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
                <input
                  name="postal_code"
                  type="text"
                  required
                  value={postalCode}
                  onChange={handlePostalCodeChange}
                  onBlur={() => quoteShipping(postalCode)}
                />
              </label>
              <label>
                Ort
                <input name="city" type="text" required />
              </label>

              {shippingLoading && <p role="status">Hämtar fraktalternativ...</p>}
              {shippingError && (
                <div>
                  <p className="shop-error">{shippingError}</p>
                  {/^\d{3} ?\d{2}$/.test(postalCode) && (
                    <button type="button" className="shop-btn" onClick={() => quoteShipping(postalCode)}>
                      Försök igen
                    </button>
                  )}
                </div>
              )}
              {shippingQuote && (
                <div className="shop-shipping-options">
                  {shippingQuote.delivery?.date && (() => {
                    let [year, month, day] = shippingQuote.delivery.date.split('-').map(Number)
                    let deliveryDate = new Date(year, month - 1, day)
                    let formattedDate = deliveryDate.toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'numeric',
                    })
                    return <p>Beräknad leverans: {formattedDate}</p>
                  })()}
                  {!shippingQuote.delivery?.date && shippingQuote.delivery?.day_range && (
                    <p>Beräknad leverans: {shippingQuote.delivery.day_range}</p>
                  )}

                  <label className="shop-shipping-option">
                    <input
                      type="radio"
                      name="shipping_method"
                      value="pickup_point"
                      checked={shippingMethod === 'pickup_point'}
                      disabled={!shippingQuote.service_points?.length}
                      onChange={() => {
                        setShippingMethod('pickup_point')
                        setPickupPointId('')
                      }}
                    />
                    Ombud — {shippingQuote.prices.pickup_point === 0 ? 'Fri frakt' : formatPrice(shippingQuote.prices.pickup_point)}
                  </label>
                  {shippingQuote.service_points === null && (
                    <p>Ombuden kan inte hämtas just nu. Du kan välja hemleverans.</p>
                  )}
                  {Array.isArray(shippingQuote.service_points) && shippingQuote.service_points.length === 0 && (
                    <p>Det saknas ombud för postnumret. Du kan välja hemleverans.</p>
                  )}
                  {shippingMethod === 'pickup_point' && shippingQuote.service_points?.length > 0 && (
                    <label>
                      Välj ombud
                      <select required value={pickupPointId} onChange={(e) => setPickupPointId(e.target.value)}>
                        <option value="">Välj ett ombud</option>
                        {shippingQuote.service_points.map((point) => (
                          <option key={point.id} value={point.id}>
                            {point.name} — {point.address}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="shop-shipping-option">
                    <input
                      type="radio"
                      name="shipping_method"
                      value="home_delivery"
                      checked={shippingMethod === 'home_delivery'}
                      onChange={() => {
                        setShippingMethod('home_delivery')
                        setPickupPointId('')
                      }}
                    />
                    Hemleverans — {shippingQuote.prices.home_delivery === 0 ? 'Fri frakt' : formatPrice(shippingQuote.prices.home_delivery)}
                  </label>
                </div>
              )}

              {error && <p className="shop-error">{error}</p>}

              <button
                type="submit"
                className="shop-btn shop-btn-primary"
                disabled={
                  submitting ||
                  !stripePromise ||
                  !shippingQuote ||
                  !shippingMethod ||
                  (shippingMethod === 'pickup_point' && !pickupPointId)
                }
              >
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
            <ul>
              <li>
                <span>Varor</span>
                <span>{formatPrice(shippingMethod && shippingQuote ? shippingQuote.goods_value : total)}</span>
              </li>
              {shippingMethod && shippingQuote && (
                <li>
                  <span>Frakt</span>
                  <span>
                    {shippingQuote.prices[shippingMethod] === 0
                      ? 'Fri frakt'
                      : formatPrice(shippingQuote.prices[shippingMethod])}
                  </span>
                </li>
              )}
            </ul>
            <p className="shop-order-total">
              Totalt:{' '}
              <strong>
                {formatPrice(
                  shippingMethod && shippingQuote
                    ? Number(shippingQuote.goods_value) + Number(shippingQuote.prices[shippingMethod])
                    : total,
                )}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
