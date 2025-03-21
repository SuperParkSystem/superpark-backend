import bcrypt from "bcrypt";
import express from "express";
import type { Request, Response } from "express";

import * as driver from "../models/driver_model.ts";
import * as me from "../models/errors.ts"

import { randomFillSync } from "crypto";

const DriverSaltRounds = 10

export async function createPut(req : express.Request, res : express.Response) {
  var email = req.body.email
  var password = req.body.password
  if (email === undefined || password === undefined) {
    res.sendStatus(400)
    return
  }
  console.log("Extracted email and password")
  let salted = await bcrypt.hash(password, DriverSaltRounds)
  let result = await driver.create(email, salted)
  if (result === null || result === undefined) {
      res.sendStatus(201) // TODO: check code
  } else {
      res.sendStatus(400)
      console.log("ERROR: ", result)
  }
}

export async function createTokenPost(req : express.Request, res : express.Response) {
    var email = req.body.email
    var password = req.body.password
    if (email === undefined || password === undefined) {
        res.sendStatus(400)
        return
    }
    const passHashRes = await driver.fetchPass(email)
    if (passHashRes.type != me.NoError) {
        res.status(401).send({msg: "Not authenticated or unknown error"})
        return
    }
    const passHash = passHashRes.passHash
    if (passHash === undefined) {
        res.status(500).send({msg: "passhash unexpectedly undefined"})
        return
    }
    console.log("Passhash: ", passHash)
    try {
        if (!await bcrypt.compare(password, passHash)) {
            res.sendStatus(401)
            return
        }
    } catch (err:any) {
        console.log(err)
        res.sendStatus(401)
        return
    }
    const buf = Buffer.alloc(64)
    randomFillSync(buf)
    const token = buf.toString('base64')
    driver.createToken(email, token)
    res.status(201)
    res.send({token: token})
}

export async function testToken(req: Request, res: Response) {
    var email : string | undefined | string[] = req.headers['x-email']
    res.status(200)
    res.send({msg: "Token verified", email: email})
}

export async function startSessionPut(req: Request, res: Response) {
    var email : string | undefined | string[] = req.headers['x-email']
    var parkingOwner : string | undefined = req.query.parkingOwnerEmail?.toString()
    if (typeof email != 'string') {
        res.sendStatus(501)
        return
    }
    if (parkingOwner === undefined) {
        res.sendStatus(400)
        return
    }
    var result = await driver.startSession(email, parkingOwner)
    if (result.type == me.UnknownError) {
        res.sendStatus(501)
        return
    } else if (result.type === me.DuplError) {
        res.status(400)
        res.send({msg: "Session exists", })
        return
    }
    res.status(201)
    res.send({sessionID: result.sessionID, lat: result.lat, lon: result.lon, startTime: result.startTime})
    return 
}


export async function stopSessionPut(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    var parkingOwner = req.query.parkingOwnerEmail
    var sessionID = req.body.sessionID
    if (parkingOwner === undefined || sessionID === undefined || email === undefined) {
        res.sendStatus(400)
        return
    }
    var result = await driver.stopSession(sessionID, email, parkingOwner.toString())
    if (result.type === me.NoError) {
        res.status(200)
        res.send({duration: result.duration, totalAmount: result.totalAmount, penaltyAmount: result.penaltyAmount})
    } else {
        res.status(400)
        res.send({msg: "Error stopping session"})
    }
}

export async function paySessionPost(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    if (req.body === undefined) {
        res.status(400)
        res.send({msg: 'Missing request body'})
        return
    }
    var sessionID = req.body.sessionID.toString()
    if (email === undefined) {
        res.sendStatus(500)
        return
    } else if (sessionID === undefined) {
        res.sendStatus(400)
        return
    }
    const result = await driver.paySession(sessionID, email)
    if (result.type === me.NoError) {
        res.status(200)
        res.send({totalAmount: result.totalAmount, penaltyAmount: result.penaltyAmount})
        return
    } else {
        res.sendStatus(500)
        return
    }
}

export async function getBalanceGet(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    if (email === undefined) {
        res.sendStatus(500)
        return
    }
    const result = await driver.getBalance(email)
    res.status(200)
    res.send({balance: result.balance})
    return
}

export async function getProfileGet(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    if (email === undefined) {
        res.sendStatus(500)
        return
    }
    var result = await driver.getProfile(email)
    res.status(200)
    res.send({email: result.email, balance: result.balance})
    return

}

export async function changePasswordPost(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    if (email === undefined) {
        res.sendStatus(500)
        return
    }
    var oldPass = req.body.oldPassword
    var newPass = req.body.newPassword
    if (oldPass === undefined || newPass === undefined) {
        res.status(400)
        res.send({msg: "Missing params oldPassword or newPassword"})
        return
    }
    var oldHashRes = await driver.fetchPass(email)
    if (oldHashRes.type === me.NotExistError) {
        res.status(500).send({msg: "Driver does not exist"})
        return
    } else if (oldHashRes.type === me.UnknownError) {
        res.status(500).send({msg: "Unknown error"})
        return
    }
    const oldHash = oldHashRes.passHash
    if (oldHash === undefined) {
        res.status(500).send({msg: "Unknown error"})
        return
    }

    const validPass = await bcrypt.compare(oldPass, oldHash)
    if (!validPass) {
        res.status(401)
        res.send({ msg: "Incorrect password" })
        return
    }

    var result = await driver.changePassword(email, newPass)
    if (result.type === me.NoError) {
        res.sendStatus(200)
    } else if (result.type === me.NotExistError) {
        res.status(401)
        res.send({msg: "Incorrect password"})
    } else {
        res.status(500)
        res.send({msg: "Unknown error"})
        console.log(result)
    }
}

export async function getSessions(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString()
    if (email === undefined) {
        res.status(500)
        res.send({msg: 'Missing \"x-email\" header from middleware'})
        return
    }
    const result = await driver.getActiveSession(email)
    if (result.type == me.NoError) {
        res.status(200)
        res.send({duration: result.duration, sessionID: result.sessionID, startTime: result.startTime})
    } else if (result.type == me.NotExistError) {
        res.status(404)
        res.send({msg: "No active sessions"})
    } else {
        res.status(500)
        console.log(result)
        res.send({msg: 'Unknown error'})
    }
}
