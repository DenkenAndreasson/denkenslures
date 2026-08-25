import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  let [items, setItems] = useState([])

  let addToCart = (product, quantity) => {
    setItems((prev) => {
      let existing = prev.find((item) => item.id === product.id)

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
          image_url: product.image_url,
          model: product.model,
          size: product.size,
        },
      ]
    })
  }

  let removeFromCart = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  let clearCart = () => {
    setItems([])
  }

  let updateQuantity = (id, quantity) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  let total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
