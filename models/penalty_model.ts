import pool from "../database";
import * as me from "../models/errors";

export async function deductPenalty(email: string, penaltyAmount: number) {
    try {
        const driver = await pool.query("SELECT balance FROM drivers WHERE email = $1;", [email]);
        if (driver.rows.length === 0) {
            return { type: me.NotExistError };
        }

        const newBalance = driver.rows[0].balance - penaltyAmount;
        await pool.query("UPDATE drivers SET balance = $1 WHERE email = $2;", [newBalance, email]);

        return { type: me.NoError, new_balance: newBalance };
    } catch (error) {
        console.error("Error applying penalty:", error);
        return { type: me.UnknownError };
    }
}

