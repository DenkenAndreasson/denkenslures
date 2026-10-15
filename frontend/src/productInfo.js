export const PLACEHOLDER_IMAGE = '/products/placeholder.svg'

export function productImage(product) {
  return product.image_url || PLACEHOLDER_IMAGE
}

export function productVariants(product) {
  let v = product.variants
  if (!v) return []
  if (Array.isArray(v)) return v
  try {
    let parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function productMeta(product) {
  let type = product.model || product.category
  let size = product.size || productVariants(product).join(', ')
  return [type, size].filter(Boolean).join(' · ')
}
