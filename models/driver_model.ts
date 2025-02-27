import { DatabaseError } from "pg"
import pool from "./connectionPool"
import * as me from "./errors"

import { randomUUID } from "crypto"

function calcAmt(duration) {
    return duration/(60*1000*10)
}

export async function create(email: string, password: string) {
    try { await pool.query("INSERT INTO drivers (email, password_hash) VALUES ($1, $2);", [email, password])
    } catch (err: any) {
        if (err instanceof DatabaseError) {
            if (err.code == "23505") {
                return {type: me.DuplError}
            } else {
                return {type: me.UnknownError}
            }
        }
    }
    return null
}

export async function fetchPass(email: string) {
    try {
        var result = await pool.query("SELECT password_hash FROM drivers WHERE email = $1;", [email])
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
    pool.query("INSERT INTO driver_sessions (email, session_key) VALUES ($1, $2);", [email, token])
}

export async function verifyToken(token: string) {
    try {
        var result = await pool.query("SELECT email FROM driver_sessions WHERE session_key = $1;", [token])
        if (result.rowCount == null || result.rowCount == 0) {
            return {type: me.NotExistError}
        }
        console.log("Fetched email for token: ", result.rows[0].email)
        return result.rows[0].email
    } catch (err: any) {
        return {type: me.UnknownError}
    }
}

export async function startSession(driverEmail: string, parkingOwnerEmail: string) {
    const conn = await pool.connect()
    try {
        await conn.query("BEGIN")
        var otherSessions = await conn.query("SELECT * FROM sessions WHERE end_time = NULL AND driver_email = $1;", [driverEmail])
        if (otherSessions.rowCount != null && otherSessions.rowCount> 0) {
            var po = await conn.query("SELECT session_id, lat, lon FROM parking_owners WHERE email = $1;", [otherSessions.rows[0].parking_owner_email])
            return {type: me.DuplError, sessionID: po.rows[0].session_id, lat: po.rows[0].lat, lon: po.rows[0].lon, startTime: otherSessions.rows[0].start_time}
        }
        var uuid = randomUUID().toString()
        await conn.query("INSERT INTO sessions(session_id, driver_email, parking_owner_email, start_time) VALUES ($1, $2, $3, NOW());",
                         [uuid, driverEmail, parkingOwnerEmail]
                        )
        var po = await conn.query("SELECT lat, lon FROM parking_owners WHERE email = $1;", [parkingOwnerEmail])
        await conn.query("COMMIT")
        return {type: me.NoError, sessionID: uuid, lat: po.rows[0].lat, lon: po.rows[0].lon}
    } catch (err) {
        conn.query('ROLLBACK')
        console.log(err)
        return {type: me.UnknownError}
    }finally {
        conn.release()
    }
}

export async function stopSession(sessionID: string, driverEmail: string, parkingOwnerEmail: string) {
    try {
        var res = await pool.query(
            "UPDATE sessions SET end_time=NOW() WHERE driver_email=$1 AND session_id=$2 AND parking_owner_email=$3",
            [driverEmail, sessionID, parkingOwnerEmail]
        )
        console.log("Ended session")
        if (res.rowCount == 0) {
            console.log("Session does not exist", sessionID, driverEmail, parkingOwnerEmail)
            return {type: me.NotExistError}
        }
        res = await pool.query(
            "SELECT start_time, end_time, parking_owner_email FROM sessions WHERE session_id=$1;", [sessionID]
        )
        console.log("Got final results")
        const duration = res.rows[0].end_time - res.rows[0].start_time
        return {type: me.NoError, duration: duration/1000, amount: calcAmt(duration)}
    } catch(err) {
        console.log(err)
        return {type: me.UnknownError}
    }
}

export async function paySession(sessionID: string, driverEmail: string) {
    const conn = await pool.connect()
    try {
        await conn.query("BEGIN")
        var res = await conn.query('SELECT end_time, start_time, parking_owner_email FROM sessions \
                                  WHERE session_id = $1 AND driver_email = $2;',
                                  [sessionID, driverEmail])

        if (res.rows.length == 0) {
            await conn.query('ROLLBACK')
            return {type: me.UnknownError}
        }
        const po = res.rows[0].parking_owner_email
        const amt = calcAmt(res.rows[0].end_time - res.rows[0].start_time)
        // TODO: variable rate, currently 1 every 10 minutes

        var res = await conn.query('UPDATE sessions SET payment_status = 1 WHERE \
                                   session_id = $1 AND payment_status = 0;',
                                   [sessionID])
        if (res.rowCount == null || res.rowCount == 0) {
            await conn.query('COMMIT')
            return {type: me.NoError, amount: amt}
        }
        var res = await conn.query('UPDATE drivers SET balance = balance - $1 WHERE \
                                   email = $2;',
                                   [amt, driverEmail])
        await conn.query('UPDATE parking_owners SET balance = balance + $1 WHERE \
                         email = $2;',
                        [amt, po])
        await conn.query('COMMIT')
        return {type: me.NoError, amount: amt}
    } catch (err: any) {
        await conn.query('ROLLBACK')
        return {type: me.UnknownError}
    } finally {
        conn.release()
    }
}

export async function getBalance(driverEmail: string) {
    const res = await pool.query("SELECT balance FROM drivers WHERE email = $1;", [driverEmail])
    if (res.rows.length > 0) {
    return {type: me.NoError, balance: res.rows[0].balance}
    } else {
        return {type: me.NotExistError}
    }
}

export async function getActiveSession(email: string) {
    const res = await pool.query("SELECT session_id, start_time, lat, lon FROM sessions s, parking_owners po\
                                 WHERE po.email = s.parking_owner_email AND driver_email = $1 AND end_time IS NULL;",
                                 [email])
    if (res.rows.length > 0) {
        return {type: me.NoError, startTime: res.rows[0].start_time, 
            sessionID: res.rows[0].session_id,
            duration: (Date.now() - res.rows[0].start_time)/1000}
    } else {
        return {type: me.NotExistError}
    }
}
