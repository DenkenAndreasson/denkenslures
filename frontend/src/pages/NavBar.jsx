import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

function NavBar() {
  let { items } = useCart()
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
          <Link to="/varukorg" className="shop-cart-link">
            Varukorg ({itemCount})
          </Link>
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
