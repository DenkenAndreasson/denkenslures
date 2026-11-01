import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_URL } from '../../apiConfig.js'

function OrderDetail() {
  let { id } = useParams()
  let [order, setOrder] = useState(null)
  let [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let loadOrder = async () => {
      try {
        let response = await fetch(`${API_URL}/orders/${id}`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setOrder(data)
      } catch {
        setLoadFailed(true)
      }
    }

    loadOrder()
  }, [id])

  if (loadFailed) {
    return (
      <div className="admin-page">
        <p className="admin-error">Kunde inte hämta ordern.</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="admin-page">
        <p>Laddar...</p>
      </div>
    )
  }

  let total =
    order.total == null
      ? order.items.reduce((sum, item) => sum + item.quantity * Number(item.price_at_purchase), 0)
      : Number(order.total)

  return (
    <div className="admin-page">
      <h1>Order #{order.id}</h1>

      <div className="order-customer">
        <p>
          <strong>{order.customer_name}</strong>
        </p>
        <p>{order.customer_email}</p>
        <p>
          {order.address}, {order.postal_code} {order.city}
        </p>
        <p className="order-list-date">{new Date(order.created_at).toLocaleString('sv-SE')}</p>
      </div>

      <table className="order-items">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Antal</th>
            <th>Pris</th>
            <th>Summa</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{Number(item.price_at_purchase)} kr</td>
              <td>{item.quantity * Number(item.price_at_purchase)} kr</td>
            </tr>
          ))}
          {order.shipping_method != null && order.shipping_price != null && (
            <tr>
              <td>
                {order.shipping_method === 'pickup_point' ? 'Frakt: ombud' : 'Frakt: hemleverans'}
                {order.shipping_method === 'pickup_point' && (
                  <>
                    <br />
                    {order.pickup_point_name}
                    {order.pickup_point_address && `, ${order.pickup_point_address}`}
                  </>
                )}
              </td>
              <td>1</td>
              <td>{Number(order.shipping_price) === 0 ? 'Fri frakt' : `${Number(order.shipping_price)} kr`}</td>
              <td>{Number(order.shipping_price) === 0 ? 'Fri frakt' : `${Number(order.shipping_price)} kr`}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="order-total">
        Totalt: <strong>{total} kr</strong>
      </p>
    </div>
  )
}

export default OrderDetail
