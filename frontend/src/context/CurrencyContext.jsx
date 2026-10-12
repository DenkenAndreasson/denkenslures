import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '../apiConfig.js'

const CurrencyContext = createContext(null)

const CURRENCIES = ['SEK', 'EUR', 'USD', 'IDR']

const SYMBOLS = {
  SEK: 'kr',
  EUR: '€',
  USD: '$',
  IDR: 'Rp',
}

export function CurrencyProvider({ children }) {
  let [currency, setCurrency] = useState('SEK')
  let [rates, setRates] = useState(null)
  let [error, setError] = useState(null)

  useEffect(() => {
    let loadRates = async () => {
      try {
        let response = await fetch(`${API_URL}/currency/rates`)
        if (!response.ok) throw new Error()
        let data = await response.json()
        setRates(data.rates)
      } catch {
        setError('Kunde inte hämta valutakurser.')
      }
    }

    loadRates()
  }, [])

  // Priser kommer alltid från databasen i SEK. MySQL skickar DECIMAL som
  // sträng ("899.00"), därför Number().
  let convert = (priceInSek) => {
    let price = Number(priceInSek)
    if (currency === 'SEK' || !rates || !rates[currency]) return price
    return price * rates[currency]
  }

  // Saknas kursen (laddar eller fel) visas priset i SEK, aldrig ett SEK-belopp
  // med fel valutasymbol.
  let activeCurrency = currency === 'SEK' || rates?.[currency] ? currency : 'SEK'

  let formatPrice = (priceInSek) => {
    let converted = convert(priceInSek)
    let rounded = activeCurrency === 'IDR' ? Math.round(converted) : converted.toFixed(2)
    return `${rounded} ${SYMBOLS[activeCurrency]}`
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, currencies: CURRENCIES, formatPrice, error }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
