import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

function NavBar() {
  let { items } = useCart()
  let itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
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
  )
}

export default NavBar
