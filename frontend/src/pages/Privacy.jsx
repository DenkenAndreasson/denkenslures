import NavBar from './NavBar.jsx'

function Privacy() {
  return (
    <div className="shop-page">
      <NavBar />
      <div className="shop-content">
        <h2>Integritet</h2>

        <h3>Inloggning med Google</h3>
        <p>
          När du loggar in med Google sparar vi ditt Google-id, din e-postadress och ditt namn. Vi använder dem
          för att känna igen dig och visa dina beställningar under Mina sidor. Vi får aldrig ditt lösenord, och
          vi sparar inga nycklar eller tokens från Google.
        </p>

        <h3>Beställningar</h3>
        <p>
          När du beställer sparar vi namn, e-post, adress, postnummer, ort, varorna och fraktsättet. Uppgifterna
          behövs för att leverera ordern. Är du inloggad kopplas ordern till ditt konto.
        </p>

        <h3>Cookies och lagring i webbläsaren</h3>
        <p>
          Är du inloggad har du en cookie med ett slumpat sessions-id. Den gäller i en timme och tas bort när du
          loggar ut. Varukorgen sparas i din webbläsare och skickas inte till oss förrän du går till kassan.
        </p>

        <h3>Tjänster som får uppgifter</h3>
        <p>
          Stripe får din e-postadress och beloppet när du betalar. PostNord får postnumret för att visa ombud och
          leveranstid.
        </p>
      </div>
    </div>
  )
}

export default Privacy
