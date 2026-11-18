import { Link, useSearchParams } from 'react-router-dom'
import { API_URL } from '../apiConfig.js'
import NavBar from './NavBar.jsx'

const ERROR_TEXT = {
  avbruten: 'Inloggningen avbröts. Du är inte inloggad.',
  ogiltig: 'Inloggningen kunde inte bekräftas. Försök igen.',
  google: 'Google svarar inte just nu. Försök igen om en stund.',
  server: 'Något gick fel när vi loggade in dig. Försök igen om en stund.',
}

function Login() {
  let [searchParams] = useSearchParams()
  let error = searchParams.get('fel')

  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <div className="shop-thankyou">
          <h2>Logga in</h2>
          <p>Logga in för att se dina beställningar under Mina sidor.</p>
          {error && <p className="shop-error">{ERROR_TEXT[error] ?? ERROR_TEXT.server}</p>}
          {/* En vanlig länk, inte fetch: webbläsaren ska följa omdirigeringen till Google. */}
          <a href={`${API_URL}/auth/google`} className="shop-btn shop-btn-primary">
            Logga in med Google
          </a>
          <Link to="/integritet" className="shop-back-link">
            Så hanterar vi dina uppgifter
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
