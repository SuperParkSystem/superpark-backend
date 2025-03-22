import { describe, test, expect } from "bun:test";
import db from "./models/connectionPool"


const URL = process.env.BACKEND_URL || "http://localhost:3000"

await db.query("DELETE FROM driver_sessions")
await db.query("DELETE FROM sessions")
await db.query("DELETE FROM drivers")
await db.query("DELETE FROM parking_owners_sessions")
await db.query("DELETE FROM parking_owners")
console.log("Cleared all tables")

async function makeRequest(url: string, method: string, body: any, headers: any, query: any) {
    let qp = ""
    if (query !== undefined) {
        qp = new URLSearchParams(query).toString()
    }
    let req = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...headers
        },
        body: undefined
    }
    if (method != "GET") {
        req.body = JSON.stringify(body)
    }
    let finalURL = URL + url
    if (qp.length > 0) {
        finalURL = finalURL + "?" + qp
    }
    let resp =  await fetch(finalURL, req)
    let resBody = await resp.text()
    try {
        resp.jbod = JSON.parse(resBody)
    }   catch (e) {
        console.log("Error parsing JSON", e)
        console.log("Body was ", resBody)
    }
    return resp
}

test("Driver integration test", async () => {
    let resp = await makeRequest("/auth/driver", "PUT", {
        email: "abc@x.com",
        password: "1234"
    }, {}, undefined)
    expect(resp.status).toBe(201)
    resp = await makeRequest("/auth/driver", "PUT", {
        email: "abc@x.com",
        password: "1234"
    }, {}, undefined)
    // duplicate
    expect(resp.status).toBe(400)

    resp = await makeRequest("/auth/driver/token", "POST", {
        email: "abc@x.com",
        password: "wrongpass"
    }, {}, undefined)
    expect(resp.status).toBe(401)

    resp = await makeRequest("/auth/driver/token", "POST", {
        email: "abc@x.com",
        password: "1234",
    }, {}, undefined)
    expect(resp.status).toBe(201)
    const token = resp.jbod.token
    expect(token).toBeTypeOf("string")

    console.log("Driver auth tests done")

    const hdr = {
        "Authorization": `Bearer ${token}`
    }

    resp = await makeRequest("/driver", "GET", {}, hdr, undefined)
    expect(resp.status).toBe(200)
    console.log(resp.jbod)
    expect(resp.jbod.email).toBe("abc@x.com")
    expect(resp.jbod.balance).toBeTypeOf("string") // since exact decimals are stored

    console.log("Driver profile tests done")

    // Create parking lot owner
    resp = await makeRequest("/auth/parkingOwner", "PUT", {
        email: "owner@x.com",
        password: "1234"
    }, {}, undefined)
    expect(resp.status).toBe(201)

    resp = await makeRequest("/auth/parkingOwner/token", "POST", {
        email: "owner@x.com",
        password: "1234"
    }, {}, undefined)
    expect(resp.status).toBe(201)
    const ownerToken = resp.jbod.token
    expect(ownerToken).toBeTypeOf("string")

    console.log("Parking owner tests done")

    const ownerHdr = {
        "Authorization": `Bearer ${ownerToken}`
    }

    // Set latitude and longitude
    resp = await makeRequest("/parkingOwner/location", "POST", {}, ownerHdr, {
        lat: 40.7128,
        lon: -74.0060
    })
    console.log(resp)
    expect(resp.status).toBe(201)

    // Start a session
    resp = await makeRequest("/driver/session/start", "PUT", {}, hdr, {
        parkingOwnerEmail: "owner@x.com"
    })
    expect(resp.status).toBe(201)
    const sessionID = resp.jbod.sessionID
    console.log(resp.jbod)
    expect(sessionID).toBeTypeOf("string")
    expect(resp.jbod.lat).toBeTypeOf("number")
    expect(resp.jbod.lon).toBeTypeOf("number")
    expect(resp.jbod.startTime).toBeTypeOf("string")

    // Attempt to create a duplicate session
    resp = await makeRequest("/driver/session/start", "PUT", {}, hdr, {
        parkingOwnerEmail: "owner@x.com"
    })
    expect(resp.status).toBe(400)
    console.log(resp.jbod.msg)

    // Stop the session
    resp = await makeRequest(`/driver/session/stop`, "PUT", {sessionID: sessionID}, hdr, {parkingOwnerEmail: "owner@x.com"})
    expect(resp.status).toBe(200)

    // Pay for the session
    resp = await makeRequest(`/driver/session/pay`, "POST", {
        sessionID: sessionID
    }, hdr, {})
    expect(resp.status).toBe(200)
    expect(resp.jbod.totalAmount).toBeTypeOf("number")
    expect(resp.jbod.penaltyAmount).toBeTypeOf("number")

}, 100000)