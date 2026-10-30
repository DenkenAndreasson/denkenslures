import { useState } from 'react'
import { API_URL } from '../../apiConfig.js'
import { productImage } from '../../productInfo.js'

// Samma gräns som servern (MAX_IMAGE_BYTES).
const MAX_MB = 4

// Laddar upp EN bild till vår egen server, som laddar upp den till Supabase.
// React har ingen Supabase-nyckel och anropar aldrig Supabase.
function ProductImageUpload({ product, onUploaded }) {
  let [file, setFile] = useState(null)
  let [error, setError] = useState(null)
  let [message, setMessage] = useState(null)
  let [uploading, setUploading] = useState(false)

  let handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!file) {
      setError('Välj en bild först.')
      return
    }

    let formData = new FormData()
    formData.append('image', file)

    setUploading(true)
    try {
      let response = await fetch(`${API_URL}/admin/products/${product.id}/image`, {
        method: 'POST',
        body: formData,
      })
      // 413 kommer från Vercel när filen är större än 4,5 MB. Då finns ingen JSON.
      if (response.status === 413) throw new Error(`Bilden är för stor. Max ${MAX_MB} MB.`)
      let data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error)

      onUploaded({ image_url: data.image_url, image_path: data.image_path })
      setFile(null)
      e.target.reset()
      setMessage(data.searchIndexed ? 'Bilden är uppladdad.' : 'Bilden är uppladdad, men sökindexet är inte uppdaterat.')
    } catch (err) {
      setError(err.message || 'Kunde inte ladda upp bilden.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section>
      <h2>Produktbild</h2>
      <img className="admin-image-preview" src={productImage(product)} alt={product.name} />
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
        />
        <p className="admin-intro">JPEG eller PNG, max {MAX_MB} MB.</p>
        <button className="btn" type="submit" disabled={uploading}>
          {uploading ? 'Laddar upp...' : product.image_path ? 'Byt bild' : 'Ladda upp bild'}
        </button>
      </form>
      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}
    </section>
  )
}

export default ProductImageUpload
