import bcrypt from "bcrypt";
import express from "express";
import { Request, Response } from "express";

import * as driver from "../models/driver_model.ts";
// import * as me from "../models/errors.ts"

import { randomFillSync } from "crypto";

const DriverSaltRounds = 10

export async function createPut(req : express.Request, res : express.Response) {
  var email = req.body.email
  var password = req.body.password
  if (email == undefined || password === undefined) {
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
    const passHash = await driver.fetchPass(email)
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
