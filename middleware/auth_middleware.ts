import type { Request, Response, NextFunction } from "express"

import * as driver from "../models/driver_model"
import * as parkingOwner from "../models/parkingOwner_model"

export async function driverAuth(req: Request, res: Response, next: NextFunction) {
  var authHeader: string | undefined = req.headers['authorization']
  if (authHeader == undefined) {
    res.sendStatus(401)
    return
  }
  var encoded = authHeader?.split(' ')[1]
  if (encoded === undefined) {
      res.sendStatus(401)
      return
  }
  var email = await driver.verifyToken(encoded)
  req.headers['x-email'] = email
  next()
}

export async function parkingOwnerAuth(req: Request, res: Response, next: NextFunction) {
  var authHeader: string | undefined = req.headers['authorization']
  if (authHeader == undefined) {
    res.sendStatus(401)
    return
  }
  var encoded = authHeader?.split(' ')[1]
  if (encoded === undefined) {
      res.sendStatus(401)
      return
  }
  var email = await parkingOwner.verifyToken(encoded)
  req.headers['x-email'] = email
  next()
}
