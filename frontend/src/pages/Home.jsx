import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import NavBar from './NavBar.jsx'

function Home() {
  let { addToCart } = useCart()
  let [products, setProducts] = useState([])
  let [error, setError] = useState(null)
  let [search, setSearch] = useState('')
  let [modelFilter, setModelFilter] = useState('')
  let [sizeFilter, setSizeFilter] = useState('')

  useEffect(() => {
    let loadProducts = async () => {
      try {
        let response = await fetch(`${API_URL}/products`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setProducts(data)
      } catch {
        setError('Kunde inte hämta produkter.')
      }
    }

    loadProducts()
  }, [])

  let models = [...new Set(products.map((p) => p.model).filter(Boolean))].sort()
  let sizes = [...new Set(products.map((p) => p.size).filter(Boolean))].sort()

  let filteredProducts = products.filter((product) => {
    let matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    let matchesModel = !modelFilter || product.model === modelFilter
    let matchesSize = !sizeFilter || product.size === sizeFilter
    return matchesSearch && matchesModel && matchesSize
  })

  let hasActiveFilters = search || modelFilter || sizeFilter

  let clearFilters = () => {
    setSearch('')
    setModelFilter('')
    setSizeFilter('')
  }

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <p className="shop-tagline">
          Beten byggda för hårt fiske i svenska vatten – från grunda vikar till djupa kanter.
        </p>

        <div className="shop-filters">
          <input
            type="text"
            className="shop-search"
            placeholder="Sök bland betena..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="shop-filter-select"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
          >
            <option value="">Alla modeller</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <select
            className="shop-filter-select"
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
          >
            <option value="">Alla storlekar</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button type="button" className="shop-btn shop-btn-sm" onClick={clearFilters}>
              Rensa
            </button>
          )}
        </div>

        {error && <p className="shop-error">{error}</p>}

        {!error && filteredProducts.length === 0 && (
          <p className="shop-tagline">Inga beten matchade filtreringen.</p>
        )}

        <ul className="shop-product-grid">
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <Link to={`/produkt/${product.id}`} className="shop-product-link">
                <img src={product.image_url} alt={product.name} />
                <span className="shop-product-name">{product.name}</span>
                <span className="shop-product-meta">
                  {product.model} · {product.size}
                </span>
              </Link>
              <div className="shop-product-footer">
                <span className="shop-product-price">{product.price} kr</span>
                <button
                  type="button"
                  className="shop-btn shop-btn-sm"
                  onClick={() => addToCart(product, 1)}
                >
                  Lägg i varukorg
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Home
