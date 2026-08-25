import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import NavBar from './NavBar.jsx'

function ProductDetail() {
  let { id } = useParams()
  let navigate = useNavigate()
  let { addToCart } = useCart()
  let [product, setProduct] = useState(null)
  let [quantity, setQuantity] = useState(1)
  let [error, setError] = useState(null)

  useEffect(() => {
    let loadProduct = async () => {
      try {
        let response = await fetch(`${API_URL}/products/${id}`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setProduct(data)
      } catch {
        setError('Kunde inte hämta produkten.')
      }
    }

    loadProduct()
  }, [id])

  let handleAddToCart = () => {
    addToCart(product, quantity)
    navigate('/varukorg')
  }

  if (error) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <p className="shop-error">{error}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="shop-page">
        <NavBar />
        <div className="shop-content">
          <p>Laddar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <Link to="/" className="shop-back-link">
          ‹ Tillbaka
        </Link>

        <div className="shop-detail">
          <img src={product.image_url} alt={product.name} />

          <div className="shop-detail-info">
            <h2>{product.name}</h2>
            <p className="shop-detail-price">{product.price} kr</p>
            <p className="shop-detail-description">{product.description}</p>

            <div className="shop-detail-specs">
              <div>
                <span className="shop-label">Modell</span>
                <span>{product.model}</span>
              </div>
              <div>
                <span className="shop-label">Storlek</span>
                <span>{product.size}</span>
              </div>
            </div>

            <div className="shop-detail-actions">
              <div className="shop-quantity">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                  +
                </button>
              </div>
              <button type="button" className="shop-btn shop-btn-primary" onClick={handleAddToCart}>
                Lägg i varukorg
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
