import type { Request, Response, NextFunction } from "express"

import * as driver from "../models/driver_model"
import * as parkingOwner from "../models/parkingOwner_model"
import * as productOwner from "../models/productOwner_model"

export async function driverAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader: string | undefined = req.headers['authorization']
  if (authHeader == undefined) {
    res.sendStatus(401)
    return
  }
  const encoded = authHeader?.split(' ')[1]
  if (encoded === undefined) {
      res.sendStatus(401)
      return
  }
  const email = await driver.verifyToken(encoded)
  req.headers['x-email'] = email
  next()
}

export async function parkingOwnerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader: string | undefined = req.headers['authorization']
  if (authHeader == undefined) {
    res.sendStatus(401)
    return
  }
  const encoded = authHeader?.split(' ')[1]
  if (encoded === undefined) {
      res.sendStatus(401)
      return
  }
  const email = await parkingOwner.verifyToken(encoded)
  req.headers['x-email'] = email
  next()
}

export async function productOwnerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader: string | undefined = req.headers['authorization']
  if (authHeader == undefined) {
    res.sendStatus(401)
    return
  }
  const encoded = authHeader?.split(' ')[1]
  if (encoded === undefined) {
      res.sendStatus(401)
      return
  }
  const email = await productOwner.verifyToken(encoded)
  req.headers['x-email'] = email
  next()
}
