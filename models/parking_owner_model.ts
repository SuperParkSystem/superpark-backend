import pool from "../models/connectionPool";
import * as me from "../models/errors";

export async function getParkingOwnerByEmail(email: string) {
    try {
        const result = await pool.query(
            "SELECT * FROM parking_owners WHERE email = $1;",
            [email]
        );

        if (result.rows.length === 0) {
            return { type: me.NotExistError };
        }

        return { type: me.NoError, data: result.rows[0] };
    } catch (error) {
        console.error("Error fetching parking owner:", error);
        return { type: me.UnknownError };
    }
}