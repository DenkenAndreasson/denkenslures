import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../../apiConfig.js'

function ProductList() {
  let [products, setProducts] = useState([])
  let [showForm, setShowForm] = useState(false)
  let [error, setError] = useState(null)

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

  let handleCreate = async (e) => {
    e.preventDefault()
    let form = e.target.elements

    let newProduct = {
      name: form.name.value,
      price: Number(form.price.value),
      description: form.description.value,
      image_url: form.image_url.value,
      model: form.model.value,
      size: form.size.value,
      stock_quantity: Number(form.stock_quantity.value),
    }

    try {
      let response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      })
      if (!response.ok) throw new Error()
      let created = await response.json()

      setProducts((prev) => [...prev, created])
      setShowForm(false)
      setError(null)
    } catch {
      setError('Kunde inte skapa produkten.')
    }
  }

  return (
    <div className="admin-page">
      <h1>Produkter</h1>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-toolbar">
        <Link to="/admin" className="btn">
          <span aria-hidden="true">←</span> Tillbaka
        </Link>
        {!showForm && (
          <button className="btn btn-primary" type="button" onClick={() => setShowForm(true)}>
            Lägg till produkt
          </button>
        )}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleCreate}>
          <label>
            Namn
            <input name="name" type="text" required />
          </label>
          <label>
            Pris
            <input name="price" type="number" step="0.01" required />
          </label>
          <label className="admin-form-full">
            Beskrivning
            <textarea name="description"></textarea>
          </label>
          <label>
            Bild-URL
            <input name="image_url" type="text" />
          </label>
          <label>
            Modell
            <select name="model" defaultValue="">
              <option value="" disabled>
                Välj modell
              </option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
          <label>
            Storlek
            <input name="size" type="text" />
          </label>
          <label>
            Lagerantal
            <input name="stock_quantity" type="number" defaultValue={0} />
          </label>
          <div className="admin-form-actions admin-form-full">
            <button className="btn btn-primary" type="submit">Skapa</button>
            <button className="btn" type="button" onClick={() => setShowForm(false)}>
              Avbryt
            </button>
          </div>
        </form>
      )}

      <ul className="product-list">
        {products.map((product) => (
          <li key={product.id}>
            <Link to={`/admin/produkter/${product.id}`}>
              <img src={product.image_url} alt={product.name} />
              <span>{product.name}</span>
              <div className="product-card-footer">
                <span>{product.price} kr</span>
                <span>{product.stock_quantity} i lager</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductList
