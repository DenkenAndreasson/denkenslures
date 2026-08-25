import { Link, useLocation } from 'react-router-dom'
import NavBar from './NavBar.jsx'

function ThankYou() {
  let location = useLocation()
  let orderId = location.state?.orderId

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <div className="shop-thankyou">
          <h2>Tack för din beställning!</h2>
          {orderId ? (
            <p className="shop-tagline">
              Ordernummer: <strong>{orderId}</strong>
            </p>
          ) : (
            <p className="shop-tagline">Din beställning är mottagen.</p>
          )}
          <Link to="/" className="shop-btn shop-btn-primary">
            Fortsätt handla
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ThankYou
