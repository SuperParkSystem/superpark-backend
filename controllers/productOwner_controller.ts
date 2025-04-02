// Controller file for product owner

import bcrypt from "bcrypt";
import { randomFillSync } from "crypto";
import type { Request, Response } from "express";
import * as productOwner from "../models/productOwner_model";
import * as me from "../models/errors";

export async function createTokenPost(req: Request, res: Response) {
  const email = req.body.email;
  const password = req.body.password;
  if (email === undefined || password === undefined) {
    res.sendStatus(400);
    return;
  }
  const passHash = await productOwner.fetchPass(email);
  console.log("Passhash: ", passHash);
  try {
    if (!(await bcrypt.compare(password, passHash))) {
      res.sendStatus(401);
      return;
    }
  } catch (err: any) {
    console.log(err);
    res.sendStatus(401);
    return;
  }
  const buf = Buffer.alloc(64);
  randomFillSync(buf);
  const token = buf.toString("base64");
  productOwner.createToken(email, token);
  res.status(201);
  res.send({ token: token });
}

export async function testToken(req: Request, res: Response) {
  const email: string | undefined | string[] = req.headers["x-email"];
  if (email === undefined) {
    res.sendStatus(401);
    return;
  }
  res.status(200);
  res.send({ msg: "Token verified", email: email });
}

export async function addBalancePost(req: Request, res: Response) {
  // Add balance to a driver
  const email = req.headers["x-email"];
  const amount = req.body.amount;
  if (email === undefined || amount === undefined) {
    res.status(400);
    res.send({ msg: "Missing email or amount" });
    return;
  }
  const result = await productOwner.increaseBalance(email.toString(), amount);
  if (result.type === me.NoError) {
    res.status(200);
    res.send({ msg: "Updated balance" });
  } else {
    res.send(400);
    res.send({ msg: "Error updating balance" });
  }
}

// export async function createPut(req: Request, res: Response) {
//   const email: string | undefined = req.body.email?.toString();
//   const password: string | undefined = req.body.password?.toString();
// 
//   if (email === undefined || password === undefined) {
//       res.status(400)
//       res.send({msg: "Missing email or password"})
//   } else {
// 
//   }
// }
