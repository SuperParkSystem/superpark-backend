import pool from "./connectionPool"; //  Correct database connection import
import * as me from "../models/errors";

export async function getPaymentStatus(email: string) {
    try {
        const result = await pool.query(
            "SELECT email, balance, balance < 0 AS payment_due FROM parking_owners WHERE email = $1;",
            [email]
        );

        if (result.rows.length === 0) {
            return { type: me.NotExistError };
        }

        return {
            type: me.NoError,
            email: result.rows[0].email,
            balance: result.rows[0].balance,
            payment_due: result.rows[0].payment_due
        };
    } catch (error) {
        console.error("Error fetching payment status:", error);
        return { type: me.UnknownError };
    }
}