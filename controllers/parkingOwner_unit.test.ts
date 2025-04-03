import { expect, test, mock, describe, jest } from "bun:test"
import * as me from "../models/errors.ts";
import * as bc from "bcrypt"

import * as pc from "./parkingOwner_controller.ts"
import { createToken } from "../models/driver_model.ts";

mock.module("../models/parkingOwner_model.ts", () => {
    return {
        create: async (email: string, password: string) => {
            if (email == "existing@mail.com") {
                return { type: me.DuplError }
            } else if (email == "error@mail.com") {
                return { type: me.UnknownError }
            } else {
                return null
            }
        },
        fetchPass: async (email: string) => {
            if (email == "existing@mail.com") {
                return {type: me.NoError, passHash: bc.hashSync("password", 10)}
            } else if (email == "error@mail.com") {
                return { type: me.UnknownError }
            } else {
                return {type: me.NotExistError}
            }
        },
        createToken: async (email: string, token: string) => {
        },
        verifyPaymentStatus: async (sessionID: string) => {
            if (sessionID == "unknownerror") {
                return { type: me.UnknownError }
            } else if (sessionID == "notexist") {
                return { type: me.NotExistError }
            } else {
                return { type: me.NoError, verified: true }
            }
        }
    }
})

function jestRes() {
    return { send: jest.fn(), status: jest.fn() }
}


describe("parking owner sign up", async () => {
    test("missing fields", async () => {
        var mReq = {
            body: { email: "abc@x.com" }
        }
        var mRes = jestRes()
        await pc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
        expect(mRes.send).toBeCalledWith({ msg: "Missing fields" })
    })

    test("duplicate email", async () => {
        var mReq = {
            body: { email: "existing@mail.com", password: "password" }
        }
        var mRes = jestRes()
        await pc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
        expect(mRes.send).toBeCalledWith({ msg: "Email exists" })
    })

    test("unknown error", async () => {
        var mReq = {
            body: { email: "error@mail.com", password: "password" }
        }
        var mRes = jestRes()
        await pc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(500)
        expect(mRes.send).toBeCalledWith({ msg: "Unknown error" })
    })

    test("success", async () => {
        var mReq = {
            body: { email: "new@mail.com", password: "password" }
        }
        var mRes = jestRes()
        await pc.createPut(mReq, mRes)
        expect(mRes.status).toBeCalledWith(201)
        expect(mRes.send).toBeCalledWith({ msg: "Success" })
    })
})

describe("parking owner login", async () => {
    test("missing fields", async () => {
        var mReq = {
            body: { email: "abc@x.com" }
        }
        var mRes = jestRes()
        await pc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
    })

    test("incorrect password", async () => {
        var mReq = {
            body: { email: "existing@mail.com", password: "wrongpassword" }
        }
        var mRes = jestRes()
        await pc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(401)
    })

    test("unknown error", async () => {
        var mReq = {
            body: { email: "error@mail.com", password: "password" }
        }
        var mRes = jestRes()
        await pc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(500)
    })

    test("success", async () => {
        var mReq = {
            body: { email: "existing@mail.com", password: "password" }
        }
        var mRes = jestRes()
        await pc.createTokenPost(mReq, mRes)
        expect(mRes.status).toBeCalledWith(201)
        expect(mRes.send).toBeCalledWith(expect.objectContaining({ token: expect.any(String) }))
    })
})

describe("parking owner verify payment", async () => {
    test("missing sessionID", async () => {
        var mReq = {
            query: {}
        }
        var mRes = jestRes()
        await pc.verifyPaymentGet(mReq, mRes)
        expect(mRes.status).toBeCalledWith(400)
        expect(mRes.send).toBeCalledWith({ msg: 'Missing sessionID' })
    })

    test("session does not exist", async () => {
        var mReq = {
            query: { sessionID: "notexist" }
        }
        var mRes = jestRes()
        await pc.verifyPaymentGet(mReq, mRes)
        expect(mRes.status).toBeCalledWith(404)
        expect(mRes.send).toBeCalledWith({ msg: 'Session does not exist' })
    })

    test("unknown error", async () => {
        var mReq = {
            query: { sessionID: "unknownerror" }
        }
        var mRes = jestRes()
        await pc.verifyPaymentGet(mReq, mRes)
        expect(mRes.status).toBeCalledWith(500)
        expect(mRes.send).toBeCalledWith({ msg: 'Unknown error' })
    })

    test("success", async () => {
        var mReq = {
            query: { sessionID: "validsession" }
        }
        var mRes = jestRes()
        await pc.verifyPaymentGet(mReq, mRes)
        expect(mRes.status).toBeCalledWith(200)
        expect(mRes.send).toBeCalledWith({ verified: true })
    })
})