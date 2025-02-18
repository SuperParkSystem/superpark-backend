import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import * as parkingOwner from "../models/parkingOwner_model.ts";

import { randomFillSync } from "crypto";

const ParkingOwnerSaltRounds = 10

export async function createPut(req : Request, res : Response) {
  var email = req.body.email
  var password = req.body.password
  if (email == undefined || password === undefined) {
    res.sendStatus(400)
    return
  }
  console.log("Extracted email and password")
  let salted = await bcrypt.hash(password, ParkingOwnerSaltRounds)
  let result = await parkingOwner.create(email, salted, undefined, undefined)
  if (result === null || result === undefined) {
      res.sendStatus(201) // TODO: check code
  } else {
      res.sendStatus(400)
      console.log("ERROR: ", result)
  }
}

export async function createTokenPost(req : Request, res : Response) {
    var email = req.body.email
    var password = req.body.password
    if (email === undefined || password === undefined) {
        res.sendStatus(400)
        return
    }
    const passHash = await parkingOwner.fetchPass(email)
    console.log("Passhash: ", passHash)
    if (! await bcrypt.compare(password, passHash)) {
        res.sendStatus(401)
        return
    }
    const buf = Buffer.alloc(64)
    randomFillSync(buf)
    const token = buf.toString('base64')
    parkingOwner.createToken(email, token)
    res.status(201)
    res.send({token: token})
}

export async function testToken(req: Request, res: Response) {
    var email : string | undefined | string[] = req.headers['x-email']
    res.status(200)
    res.send({msg: "Token verified", email: email})
}
