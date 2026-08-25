import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import NavBar from './NavBar.jsx'

function Cart() {
  let { items, removeFromCart, updateQuantity, total } = useCart()

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <h2>Varukorg</h2>

        {items.length === 0 ? (
          <p>Varukorgen är tom.</p>
        ) : (
          <>
            <ul className="shop-cart-list">
              {items.map((item) => (
                <li key={item.id}>
                  <img src={item.image_url} alt={item.name} />
                  <div className="shop-cart-item-info">
                    <span className="shop-product-name">{item.name}</span>
                    <span className="shop-product-meta">
                      {item.model} · {item.size}
                    </span>
                  </div>
                  <div className="shop-quantity">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <span className="shop-cart-item-price">{item.price * item.quantity} kr</span>
                  <button
                    type="button"
                    className="shop-remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Ta bort"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className="shop-cart-total">
              <span>
                Totalt: <strong>{total} kr</strong>
              </span>
              <Link to="/kassa" className="shop-btn shop-btn-primary">
                Till kassan
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart
