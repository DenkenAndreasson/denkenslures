import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'

function NavBar() {
  let { items } = useCart()
  let { currency, setCurrency, currencies } = useCurrency()
  let itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  let [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    let onScroll = () => setShowBackToTop(window.scrollY > 200)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  let scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <header className="shop-header">
        <div className="shop-header-inner">
          <Link to="/" className="shop-logo">
            <h1>Denken's Softlures</h1>
          </Link>
          <div className="shop-header-actions">
            <select
              className="shop-filter-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              aria-label="Välj valuta"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Link to="/varukorg" className="shop-cart-link">
              Varukorg ({itemCount})
            </Link>
          </div>
        </div>
      </header>
      {showBackToTop && (
        <button
          type="button"
          className="shop-back-to-top"
          onClick={scrollToTop}
          aria-label="Tillbaka till toppen"
        >
          ↑
        </button>
      )}
    </>
  )
}

export default NavBar
