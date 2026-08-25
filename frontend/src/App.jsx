import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import ThankYou from './pages/ThankYou.jsx'
import AdminHome from './pages/admin/AdminHome.jsx'
import ProductList from './pages/admin/ProductList.jsx'
import ProductEdit from './pages/admin/ProductEdit.jsx'
import OrderList from './pages/admin/OrderList.jsx'
import OrderDetail from './pages/admin/OrderDetail.jsx'
import './pages/admin/admin.css'
import './pages/Shop.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/produkt/:id" element={<ProductDetail />} />
      <Route path="/varukorg" element={<Cart />} />
      <Route path="/kassa" element={<Checkout />} />
      <Route path="/tack" element={<ThankYou />} />
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/admin/produkter" element={<ProductList />} />
      <Route path="/admin/produkter/:id" element={<ProductEdit />} />
      <Route path="/admin/ordrar" element={<OrderList />} />
      <Route path="/admin/ordrar/:id" element={<OrderDetail />} />
    </Routes>
  )
}

export default App
