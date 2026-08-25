import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_URL } from '../../apiConfig.js'

function ProductEdit() {
  let { id } = useParams()
  let navigate = useNavigate()
  let [product, setProduct] = useState(null)
  let [models, setModels] = useState([])
  let [error, setError] = useState(null)
  let [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let loadProduct = async () => {
      try {
        let response = await fetch(`${API_URL}/products/${id}`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setProduct(data)
      } catch {
        setLoadFailed(true)
      }
    }

    let loadModels = async () => {
      let response = await fetch(`${API_URL}/products`)
      let data = await response.json()
      setModels([...new Set(data.map((p) => p.model).filter(Boolean))].sort())
    }

    loadProduct()
    loadModels()
  }, [id])

  let handleSubmit = async (e) => {
    e.preventDefault()
    let form = e.target.elements

    let updatedProduct = {
      name: form.name.value,
      price: Number(form.price.value),
      description: form.description.value,
      image_url: form.image_url.value,
      model: form.model.value,
      size: form.size.value,
      stock_quantity: Number(form.stock_quantity.value),
    }

    try {
      let response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      })
      if (!response.ok) throw new Error()

      navigate('/admin/produkter')
    } catch {
      setError('Kunde inte spara produkten.')
    }
  }

  let handleDelete = async () => {
    if (!window.confirm(`Är du säker på att du vill ta bort "${product.name}"?`)) {
      return
    }

    try {
      let response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()

      navigate('/admin/produkter')
    } catch {
      setError('Kunde inte ta bort produkten.')
    }
  }

  if (loadFailed) {
    return (
      <div className="admin-page">
        <p className="admin-error">Kunde inte hämta produkten.</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="admin-page">
        <p>Laddar...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h1>Redigera produkt</h1>
      {error && <p className="admin-error">{error}</p>}
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Namn
          <input name="name" type="text" defaultValue={product.name} required />
        </label>
        <label>
          Pris
          <input name="price" type="number" step="0.01" defaultValue={product.price} required />
        </label>
        <label className="admin-form-full">
          Beskrivning
          <textarea name="description" defaultValue={product.description}></textarea>
        </label>
        <label>
          Bild-URL
          <input name="image_url" type="text" defaultValue={product.image_url} />
        </label>
        <label>
          Modell
          <select name="model" defaultValue={product.model || ''}>
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
          <input name="size" type="text" defaultValue={product.size} />
        </label>
        <label>
          Lagerantal
          <input name="stock_quantity" type="number" defaultValue={product.stock_quantity} />
        </label>
        <button className="btn admin-form-full" type="submit">Spara</button>
      </form>
      <button className="btn btn-danger" type="button" onClick={handleDelete}>
        Ta bort
      </button>
    </div>
  )
}

export default ProductEdit
