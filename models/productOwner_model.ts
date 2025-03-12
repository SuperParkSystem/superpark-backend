import { DatabaseError } from "pg"
import pool from "./connectionPool"
import * as me from "./errors"

export async function createOwner(email: string, passwordHash: string) {
    // Only to be used to create test user
    try {
        await pool.query("INSERT INTO product_owners (email, password_hash) VALUES ($1, $2);", [email, passwordHash])
    } catch (err: any) {
        if (err instanceof DatabaseError) {
            if (err.code == "23505") {
                return {type: me.DuplError}
            } else {
                console.log(err)
                return {type: me.UnknownError}
            }
        } else {
            console.log(err)
            return {type: me.UnknownError}
        }
    }
}

export async function fetchPass(email: string) {
    try {
        var result = await pool.query("SELECT password_hash FROM product_owners WHERE email = $1;", [email])
        if (result.rowCount === null) {
            return {type: me.NotExistError}
        }
        if (result.rowCount < 1) {
            return {type: me.NotExistError}
        }
        console.log("result rows: ")
        console.log(result.rows)
        console.log("done")
        return result.rows[0].password_hash
    } catch (err: any) {
        return {type: me.UnknownError}
    }
}

export async function createToken(email: string, token: string) {
    pool.query("INSERT INTO product_owner_sessions (email, session_key) VALUES ($1, $2);", [email, token])
}

export async function verifyToken(token: string) {
    try {
        var result = await pool.query("SELECT email FROM product_owner_sessions WHERE session_key = $1;", [token])
        if (result.rowCount == null || result.rowCount == 0) {
            return {type: me.NotExistError}
        }
        console.log("Fetched email for token: ", result.rows[0].email)
        return result.rows[0].email
    } catch (err: any) {
        return {type: me.UnknownError}
    }
}

export async function increaseBalance(driverEmail: string, amount: number) {
    try {
        var result = await pool.query("UPDATE drivers SET balance = balance + $1 WHERE email = $2;", [amount, driverEmail])
        if (result.rowCount == null || result.rowCount == 0) {
            return {type: me.NotExistError}
        }
        return {type: me.NoError}
    } catch (err: any) {
        console.log(err)
        return {type: me.UnknownError}
    }
}
