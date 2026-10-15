import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../../apiConfig.js'

function ProductImport() {
  let [report, setReport] = useState(null)
  let [loading, setLoading] = useState(null)
  let [error, setError] = useState(null)

  let runImport = async (format) => {
    setLoading(format)
    setError(null)

    try {
      let response = await fetch(`${API_URL}/admin/products/import/${format}`, { method: 'POST' })
      let data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Importen misslyckades.')
      }

      setReport(data)
    } catch (err) {
      setError(err.message || 'Kunde inte nå servern.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="admin-page">
      <h1>Importera produkter</h1>
      <p className="admin-intro">
        Hämtar leverantörens katalog (fiskeredskap). Befintliga produkter uppdateras via
        artikelnumret, nya skapas. Dina egna produkter påverkas inte.
      </p>

      <div className="admin-toolbar">
        <Link to="/admin" className="btn">
          <span aria-hidden="true">←</span> Tillbaka
        </Link>
        <div className="admin-import-buttons">
          {/* Knapparna är avstängda medan en import pågår, så att ett dubbelklick inte startar två. */}
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading !== null}
            onClick={() => runImport('csv')}
          >
            {loading === 'csv' ? 'Importerar…' : 'Importera CSV'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading !== null}
            onClick={() => runImport('xml')}
          >
            {loading === 'xml' ? 'Importerar…' : 'Importera XML'}
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {report && (
        <section className="import-report" aria-live="polite">
          <h2>Rapport ({report.format.toUpperCase()})</h2>
          <p className="import-report-sub">
            {report.total} produkter i filen · {report.importedInDatabase} importerade produkter i databasen
          </p>

          <dl className="import-stats">
            <div>
              <dt>Nya</dt>
              <dd>{report.created}</dd>
            </div>
            <div>
              <dt>Uppdaterade</dt>
              <dd>{report.updated}</dd>
            </div>
            <div>
              <dt>Oförändrade</dt>
              <dd>{report.unchanged}</dd>
            </div>
            <div className={report.skipped.length > 0 ? 'import-stat-warn' : ''}>
              <dt>Överhoppade</dt>
              <dd>{report.skipped.length}</dd>
            </div>
          </dl>

          {report.skipped.length > 0 && (
            <>
              <h3>Överhoppade produkter</h3>
              <table className="order-items">
                <thead>
                  <tr>
                    <th>Artikelnummer</th>
                    <th>Namn</th>
                    <th>Orsak</th>
                  </tr>
                </thead>
                <tbody>
                  {report.skipped.map((item, i) => (
                    <tr key={`${item.sku}-${i}`}>
                      <td>{item.sku ?? '-'}</td>
                      <td>{item.name ?? '-'}</td>
                      <td>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}
    </div>
  )
}

export default ProductImport
