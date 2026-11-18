import { pool } from "../db.js";
import type { GoogleProfile } from "../integrations/googleAuthAdapter.js";

// Kunden känns igen på Googles sub, aldrig på e-postadressen. Två konton med samma
// e-post blir två kunder, så ingen kan ta över en annans ordrar via en e-postadress.
export async function findOrCreateGoogleCustomer(profile: GoogleProfile): Promise<number> {
    const [rows]: any = await pool.query("SELECT id FROM customers WHERE google_sub = ?", [profile.sub]);
    if (rows.length > 0) {
        return rows[0].id;
    }

    const [result]: any = await pool.query(
        "INSERT INTO customers (google_sub, email, name) VALUES (?, ?, ?)",
        [profile.sub, profile.email, profile.name]
    );
    return result.insertId;
}
