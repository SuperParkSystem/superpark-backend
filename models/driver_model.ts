import { DatabaseError } from "pg"
import pool from "./connectionPool"
import * as me from "./errors"

import { randomUUID } from "crypto"

function calcAmt(duration: number, rate: number, penaltyThresh: number | undefined, penaltyRate: number | undefined) {
    // returns (total amt, penalty amt)
    // duration: in milliseconds
    // rate: per minute
    penaltyThresh = penaltyThresh ?? 360
    penaltyRate = penaltyRate ?? rate * 10
    let minutes = duration/(60*1000)
    let normalAmt = minutes * rate
    let penaltyAmt: number = (minutes <= penaltyThresh) ? 0 : (minutes - penaltyThresh)*penaltyRate
    return [(normalAmt + penaltyAmt), penaltyAmt]
}

export async function create(email: string, password: string) {
    try {
        await pool.query("INSERT INTO drivers (email, password_hash) VALUES ($1, $2);", [email, password])
    } catch (err: any) {
        if (err instanceof DatabaseError) {
            if (err.code == "23505") {
                return { type: me.DuplError }
            } else {
                console.log(err)
                return { type: me.UnknownError }
            }
        } else {
            console.log(err)
            return { type: me.UnknownError }
        }
    }
    return null
}

export async function fetchPass(email: string) {
    try {
        const result = await pool.query("SELECT password_hash FROM drivers WHERE email = $1;", [email])
        if (result.rowCount === null) {
            return { type: me.NotExistError }
        }
        if (result.rowCount < 1) {
            return { type: me.NotExistError }
        }
        console.log("result rows: ")
        console.log(result.rows)
        console.log("done")
        return { type: me.NoError, passHash: result.rows[0].password_hash }
    } catch (err: any) {
        return { type: me.UnknownError }
    }
}

export async function createToken(email: string, token: string) {
    pool.query("INSERT INTO driver_sessions (email, session_key) VALUES ($1, $2);", [email, token])
}

export async function verifyToken(token: string) {
    try {
        const result = await pool.query("SELECT email FROM driver_sessions WHERE session_key = $1;", [token])
        if (result.rowCount == null || result.rowCount == 0) {
            return { type: me.NotExistError }
        }
        console.log("Fetched email for token: ", result.rows[0].email)
        return result.rows[0].email
    } catch (err: any) {
        return { type: me.UnknownError }
    }
}

export async function startSession(driverEmail: string, parkingOwnerEmail: string) {
    const conn = await pool.connect()
    try {
        await conn.query("BEGIN")
        const otherSessions = await conn.query("SELECT * FROM sessions WHERE end_time IS NULL AND driver_email = $1;", [driverEmail])
        if (otherSessions.rowCount != null && otherSessions.rowCount > 0) {
            const po = await conn.query("SELECT session_id, lat, lon FROM sessions s, parking_owners po WHERE po.email = s.parking_owner_email AND email = $1;", [otherSessions.rows[0].parking_owner_email])
            return { type: me.DuplError, sessionID: po.rows[0].session_id, lat: po.rows[0].lat, lon: po.rows[0].lon, startTime: otherSessions.rows[0].start_time }
        }
        const uuid = randomUUID().toString()
        await conn.query("INSERT INTO sessions(session_id, driver_email, parking_owner_email, start_time) VALUES ($1, $2, $3, NOW());",
            [uuid, driverEmail, parkingOwnerEmail]
        )
        const po = await conn.query("SELECT lat, lon FROM parking_owners WHERE email = $1;", [parkingOwnerEmail])
        const st = await conn.query("SELECT start_time FROM sessions WHERE driver_email = $1 AND end_time IS NULL;", [driverEmail])
        console.log("start_time: ", st.rows[0])
        await conn.query("COMMIT")
        return { type: me.NoError, sessionID: uuid, lat: po.rows[0].lat, lon: po.rows[0].lon, startTime: st.rows[0].start_time }
    } catch (err) {
        conn.query('ROLLBACK')
        console.log(err)
        return { type: me.UnknownError }
    } finally {
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
            return { type: me.NotExistError }
        }
        res = await pool.query(
            "SELECT start_time, end_time, parking_owner_email, po.payment_policy as pp FROM sessions s, parking_owners po WHERE session_id=$1 AND s.parking_owner_email = po.email;", [sessionID]
        )
        console.log("Got final results")
        const duration = res.rows[0].end_time - res.rows[0].start_time
        // TODO: Add penalty rate modification for parking owners
        const [amt, penaltyAmt] = calcAmt(duration, res.rows[0].pp, undefined, undefined)
        return {type: me.NoError, duration: duration/1000, totalAmount: amt, penaltyAmount: penaltyAmt}
    } catch(err) {
        console.log(err)
        return { type: me.UnknownError }
    }
}

export async function paySession(sessionID: string, driverEmail: string) {
    const conn = await pool.connect()
    try {
        await conn.query("BEGIN")
        let res = await conn.query('SELECT end_time, start_time, parking_owner_email, po.payment_policy as pp FROM sessions s, parking_owners po\
                                  WHERE session_id = $1 AND driver_email = $2 AND s.parking_owner_email = po.email;',
            [sessionID, driverEmail])

        if (res.rows.length == 0) {
            await conn.query('ROLLBACK')
            return { type: me.UnknownError }
        }
        const po = res.rows[0].parking_owner_email
        // TODO: update with custom penalty rate and thresh
        const [amt, penaltyAmt] = calcAmt(res.rows[0].end_time - res.rows[0].start_time, res.rows[0].pp, undefined, undefined)

        res = await conn.query('UPDATE sessions SET payment_status = 1 WHERE \
                                   session_id = $1 AND payment_status = 0;',
            [sessionID])
        if (res.rowCount == null || res.rowCount == 0) {
            // Already paid
            await conn.query('COMMIT')
            return {type: me.NoError, totalAmount: amt, penaltyAmount: penaltyAmt}
        }
        res = await conn.query('UPDATE drivers SET balance = balance - $1 WHERE \
                                   email = $2;',
            [amt, driverEmail])
        await conn.query('UPDATE parking_owners SET balance = balance + $1 WHERE \
                         email = $2;',
            [amt, po])
        await conn.query('COMMIT')
        return {type: me.NoError, totalAmount: amt, penaltyAmount: penaltyAmt}
    } catch (err: any) {
        await conn.query('ROLLBACK')
        return { type: me.UnknownError }
    } finally {
        conn.release()
    }
}

export async function getBalance(driverEmail: string) {
    const res = await pool.query("SELECT balance FROM drivers WHERE email = $1;", [driverEmail])
    if (res.rows.length > 0) {
        return { type: me.NoError, balance: res.rows[0].balance }
    } else {
        return { type: me.NotExistError }
    }
}

export async function getActiveSession(email: string) {
    const res = await pool.query("SELECT session_id, start_time, lat, lon, po.payment_policy as pp FROM sessions s, parking_owners po\
                                 WHERE po.email = s.parking_owner_email AND driver_email = $1 AND end_time IS NULL;",
        [email])
    if (res.rows.length > 0) {
        const duration = Date.now() - res.rows[0].start_time 
        // TODO: update with custom penalty rate and thresh
        const [amt, pamt] = calcAmt(duration, res.rows[0].pp, undefined, undefined)
        return {type: me.NoError, startTime: res.rows[0].start_time, 
            sessionID: res.rows[0].session_id,
            duration: (Date.now() - res.rows[0].start_time)/1000, totalAmount: amt, penaltyAmount: pamt}
    } else {
        return { type: me.NotExistError }
    }
}

export async function getProfile(email: string) {
    const res = await pool.query("SELECT email, balance FROM drivers WHERE email = $1;", [email])
    if (res.rows.length > 0) {
        return { type: me.NoError, email: res.rows[0].email, balance: res.rows[0].balance }
    } else {
        return { type: me.NotExistError }
    }
}

export async function changePassword(email: string, newPassHash: string) {
    const res = await pool.query("UPDATE drivers SET password_hash = $1 WHERE email = $2;", [newPassHash, email])
    if (res.rowCount == 0) {
        return { type: me.NotExistError }
    }
    return { type: me.NoError }
}
//_____________________amruta______________
export async function insertFeedback(
    driverEmail: string,
    parkingOwnerEmail: string,
    feedback: string | null,
    rating: number,
    status: string = 'pending' // Default status is 'pending'
  ) {
    try {
      await pool.query(
        `INSERT INTO driver_feedback (driver_email, parking_owner_email, feedback, rating, status)
         VALUES ($1, $2, $3, $4, $5);`,
        [driverEmail, parkingOwnerEmail, feedback, rating, status]
      );
      return { type: me.NoError };
    } catch (err: any) {
      if (err instanceof DatabaseError) {
        if (err.code === "23505") {
          return { type: me.DuplError }; // Duplicate feedback entry
        } else {
          return { type: me.UnknownError };
        }
      }
      console.error("Error inserting feedback:", err);
      return { type: me.UnknownError };
    }
  }
  //_____________________ramaswetha__________________
  //fetchRecommendedParking 

  export async function fetchRecommendedParking(driverLat?: number, driverLon?: number, radiusKm?: number) {
    try {
        let query: string;
        let params: any[]; // Explicitly define the type as any[]

        if (driverLat !== undefined && driverLon !== undefined && radiusKm !== undefined) {
            // Query with distance filter
            query = `
                SELECT email, lat, lon, payment_policy AS price,
                      (6371 * acos(cos(radians($1)) * cos(radians(lat)) 
                      * cos(radians(lon) - radians($2)) 
                      + sin(radians($1)) * sin(radians(lat)))) AS distance
                FROM parking_owners
                WHERE payment_policy IS NOT NULL
                HAVING distance <= $3
                ORDER BY price ASC, distance ASC;
            `;
            params = [driverLat, driverLon, radiusKm];
        } else {
            // Basic query (no distance filter)
            query = `
                SELECT email, lat, lon, payment_policy AS price
                FROM parking_owners
                WHERE payment_policy IS NOT NULL
                ORDER BY payment_policy ASC;
            `;
            params = []; // Explicitly set as an empty array
        }

        const result = await pool.query(query, params);

        if (result.rowCount === 0) {
            return { type: me.NotExistError };
        }

        return {
            type: me.NoError,
            parkingLots: result.rows.map((row) => ({
                email: row.email,
                latitude: row.lat,
                longitude: row.lon,
                price: row.price,
                distance: row.distance || null, // Only available in distance query
            })),
        };

    } catch (err: any) {
        if (err instanceof DatabaseError) {
            return { type: me.DbError };
        }
        console.error("Database error:", err);
        return { type: me.UnknownError };
    }
}


export async function getNearbyParkingLots(lat: number, lon: number) {
    const query = `
        SELECT email, lat, lon, payment_policy,
               ( 6371 * acos(cos(radians($1)) * cos(radians(lat)) * 
               cos(radians(lon) - radians($2)) + sin(radians($1)) * 
               sin(radians(lat))) ) AS distance
        FROM parking_owners
        ORDER BY payment_policy ASC, distance ASC
        LIMIT 10;
    `;

    try {
        const result = await pool.query(query, [lat, lon]);
        return { type: "NoError", parkingLots: result.rows };
    } catch (error) {
        console.error("Error fetching parking lots:", error);
        return { type: "DatabaseError", msg: "Failed to fetch parking lots" };
    }
}


//threshold

export async function updateThreshold(parkingOwnerEmail: string, newThreshold: number) {
    const query = `
        UPDATE parkingslot
        SET threshold = $1
        WHERE parking_owner_email = $2
        RETURNING *;
    `;

    try {
        const result = await pool.query(query, [newThreshold, parkingOwnerEmail]);
        return { type: "NoError", updatedThreshold: result.rows[0] };
    } catch (error) {
        console.error("Error updating threshold:", error);
        return { type: "DatabaseError", msg: "Failed to update threshold" };
    }
}

export async function checkThreshold(parkingOwnerEmail: string) {
    const query = `
        SELECT total_spaces, occupied_spaces, threshold
        FROM parkingslot
        WHERE parking_owner_email = $1;
    `;

    try {
        const result = await pool.query(query, [parkingOwnerEmail]);
        if (result.rows.length === 0) return { type: "NotExistError" };

        const { total_spaces, occupied_spaces, threshold } = result.rows[0];
        const occupancyRate = (occupied_spaces / total_spaces) * 100;

        if (occupancyRate >= threshold) {
            return { type: "ThresholdReached", msg: "Parking lot is almost full!" };
        }

        return { type: "NoError", msg: "Parking lot has available space." };
    } catch (error) {
        console.error("Error checking threshold:", error);
        return { type: "DatabaseError", msg: "Failed to check threshold" };
    }
}

//nearby parking slots

export const getNearbyParkingRates = async (driverLat: number, driverLon: number, maxDistance: number) => {
    const query = `
        SELECT po.email AS parking_owner_email, 
               po.lat AS parking_owner_lat, 
               po.lon AS parking_owner_lon,
               po.payment_policy AS rate,
               ( 6371 * acos( cos( radians($1) ) * cos( radians( po.lat ) ) * cos( radians( po.lon ) - radians($2) ) + sin( radians($1) ) * sin( radians( po.lat ) ) ) ) AS distance_km
        FROM parking_owners po
        WHERE ( 6371 * acos( cos( radians($1) ) * cos( radians( po.lat ) ) * cos( radians( po.lon ) - radians($2) ) + sin( radians($1) ) * sin( radians( po.lat ) ) ) ) ) <= $3
        ORDER BY distance_km;
    `;
    const values = [driverLat, driverLon, maxDistance];
    
    const result = await pool.query(query, values);
    return result.rows;
};

//get parking lot location


// Get the last parked vehicle location
export async function getVehicleLocation(driverId: number) {
    try {
        const query = `
            SELECT parked_latitude, parked_longitude
            FROM drivers
            WHERE id = $1
        `;
        const result = await pool.query(query, [driverId]);

        if (result.rows.length === 0) {
            return { type: me.NotExistError, message: "Driver not found" };
        }

        return { type: me.NoError, data: result.rows[0] };
    } catch (err) {
        return { type: me.UnknownError };
    }
}
