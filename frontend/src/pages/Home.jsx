import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import { useCart } from '../context/CartContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'
import NavBar from './NavBar.jsx'
import { productImage, productMeta } from '../productInfo.js'

const PAGE_SIZE = 12

function Home() {
  let { addToCart } = useCart()
  let { formatPrice } = useCurrency()
  let [searchParams, setSearchParams] = useSearchParams()
  let q = searchParams.get('q') ?? ''
  let page = Number(searchParams.get('page') ?? 1)
  let [text, setText] = useState(q)
  let [products, setProducts] = useState([])
  let [meta, setMeta] = useState(null)
  let [loading, setLoading] = useState(true)
  let [error, setError] = useState(null)

  useEffect(() => {
    setText(q)
  }, [q])


  useEffect(() => {
    if (text === q) return
    let timer = setTimeout(() => {
      setSearchParams(text ? { q: text } : {})
    }, 500)
    return () => clearTimeout(timer)
  }, [text, q, setSearchParams])

  // Hämta från VÅRT sök-API varje gång q eller page ändras. Aldrig direkt från Algolia.
  useEffect(() => {
    let controller = new AbortController()

    let search = async () => {
      setLoading(true)
      setError(null)
      try {
        let params = new URLSearchParams({ q, page: String(page), pageSize: String(PAGE_SIZE) })
        let response = await fetch(`${API_URL}/search?${params}`, { signal: controller.signal })
        let data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || 'Sökningen misslyckades.')
        }

        setProducts(data.data)
        setMeta(data.meta)
      } catch (err) {
        if (err.name === 'AbortError') return
        setProducts([])
        setMeta(null)
        setError(err.message || 'Kunde inte nå servern. Försök igen om en stund.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    search()
    return () => controller.abort()
  }, [q, page])

  let goToPage = (newPage) => {
    setSearchParams(q ? { q, page: String(newPage) } : { page: String(newPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  let clearSearch = () => {
    setText('')
    setSearchParams({})
  }

  let firstShown = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0
  let lastShown = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <p className="shop-tagline">
          Beten byggda för hårt fiske i svenska vatten - från grunda vikar till djupa kanter.
        </p>

        <div className="shop-filters">
          <input
            type="search"
            className="shop-search"
            placeholder="Sök bland betena..."
            aria-label="Sök produkter"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {q && (
            <button type="button" className="shop-btn shop-btn-sm" onClick={clearSearch}>
              Rensa
            </button>
          )}
        </div>

        {error && <p className="shop-error">{error}</p>}

        {!error && meta && (
          <p className="shop-search-summary" aria-live="polite">
            {meta.total === 0
              ? `Inga beten matchade "${q}".`
              : `Visar ${firstShown}-${lastShown} av ${meta.total} beten${q ? ` för "${q}"` : ''}`}
          </p>
        )}

        <ul className={`shop-product-grid${loading ? ' shop-loading' : ''}`}>
          {products.map((product) => (
            <li key={product.id}>
              <Link to={`/produkt/${product.id}`} className="shop-product-link">
                <img src={productImage(product)} alt={product.name} />
                <span className="shop-product-name">{product.name}</span>
                <span className="shop-product-meta">
                  {productMeta(product)}
                </span>
              </Link>
              <div className="shop-product-footer">
                <span className="shop-product-price">{formatPrice(product.price)}</span>
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

        {meta && meta.totalPages > 1 && (
          <nav className="shop-pagination" aria-label="Sidor">
            <button
              type="button"
              className="shop-btn shop-btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
            >
              ← Föregående
            </button>
            <span>
              Sida {meta.page} av {meta.totalPages}
            </span>
            <button
              type="button"
              className="shop-btn shop-btn-sm"
              disabled={page >= meta.totalPages || loading}
              onClick={() => goToPage(page + 1)}
            >
              Nästa →
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}

export default Home
