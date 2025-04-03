import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import * as parkingOwner from "../models/parkingOwner_model.ts";

import { randomFillSync } from "crypto";
import * as me from "../models/errors.ts"

const ParkingOwnerSaltRounds = 10

export async function createPut(req: Request, res: Response) {
  const email = req.body.email
  const password = req.body.password
  if (email === undefined || password === undefined) {
    res.status(400)
    res.send({msg: "Missing fields"})
    return
  }
  console.log("Extracted email and password")
  let salted = await bcrypt.hash(password, ParkingOwnerSaltRounds)
  let result = await parkingOwner.create(email, salted, undefined, undefined)
  if (result === null || result === undefined) {
    res.status(201)
    res.send({msg: "Success"})
  } else if (result.type === me.DuplError) {
    res.status(400)
    res.send({msg: "Email exists"})
    console.log("ERROR: ", result)
  } else {
    res.status(500)
    res.send({msg: "Unknown error"})
    console.log("ERROR: ", result)
  }
}

export async function createTokenPost(req: Request, res: Response) {
  const email = req.body.email
  const password = req.body.password
  if (email === undefined || password === undefined) {
    res.status(400)
    res.send({msg: "Missing fields"})
    return
  }
  const passHashRes = await parkingOwner.fetchPass(email)
  if (passHashRes.type != me.NoError) {
    if (passHashRes.type == me.UnknownError) {
      res.status(500)
      res.send({msg: "Unknown error"})
      return
    } else {
      res.status(400)
      res.send({ msg: "Not authenticated or unknown error" })
      return
    }
  }
  const passHash = passHashRes.passHash
  try {
    if (! await bcrypt.compare(password, passHash)) {
      res.status(401)
      res.send({msg: "Incorrect password"})
      return
    }
  } catch (err: any) {
    console.log(err)
    res.status(500)
    res.send({msg: "Internal error"})
    return
  }
  const buf = Buffer.alloc(64)
  randomFillSync(buf)
  const token = buf.toString('base64')
  parkingOwner.createToken(email, token)
  res.status(201)
  res.send({ token: token })
}

export async function testToken(req: Request, res: Response) {
  const email: string | undefined | string[] = req.headers['x-email']
  res.status(200)
  res.send({ msg: "Token verified", email: email })
}

export async function verifyPaymentGet(req: Request, res: Response) {
  console.log(req.params)
  const sessionID: string | undefined = req.query.sessionID?.toString()
  if (sessionID === undefined) {
    res.status(400)
    res.send({ msg: 'Missing sessionID' })
    return
  }
  const result = await parkingOwner.verifyPaymentStatus(sessionID)
  if (result.type != me.NoError) {
    if (result.type == me.NotExistError) {
      res.status(404)
      res.send({ msg: 'Session does not exist' })
      return
    } else {
      res.status(500)
      res.send({msg: "Unknown error"})
      return
    }
  }
  res.status(200)
  res.send({ verified: result.verified })
}

export async function getBalanceGet(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString()
  if (email === undefined) {
    res.sendStatus(500)
    return
  }
  const result = await parkingOwner.getBalance(email)
  res.status(200)
  res.send({ balance: result.balance })
}

export async function getPaymentPolicy(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString()
  if (email === undefined) {
    res.status(500)
    res.send({ msg: 'Internal server error (x-email missing)' })
    return
  }
  const result = await parkingOwner.getPaymentPolicy(email)
  if (result.type !== me.NoError) {
    res.status(400).send({ msg: 'Encountered error' })
    return
  }
  res.status(200).send({ paymentPolicy: result.policy })
}

export async function postPaymentPolicy(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString()
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error' })
    return
  }
  const pp: string | undefined = req.query['value']?.toString()
  if (pp === undefined) {
    res.status(400).send({ msg: 'Query param "value" is missing' })
    return
  }
  const ppNum = Number(pp)
  if (isNaN(ppNum)) {
    res.status(400).send({ msg: 'Query param "value" must be an integer' })
    return
  }
  await parkingOwner.setPaymentPolicy(email, Math.round(ppNum * 100) / 100)
  res.status(201).send({ msg: 'Updated' })
}

export async function getProfileGet(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString()
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error' })
    return
  }
  const result = await parkingOwner.fetchProfile(email)
  if (result.type !== me.NoError) {
    res.status(500).send({msg: 'Internal server error'})
    return
  }
  res.status(200)
  res.send({ email: result.email, lat: result.lat, lon: result.lon, balance: result.balance, paymentPolicy: result.paymentPolicy })
}

export async function setLocationPost(req: Request, res: Response) {
  console.log("Setting location")
  const email = req.headers['x-email']?.toString()
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error' })
    return
  }
  if (req.query['lat'] === undefined || req.query['lon'] === undefined) {
    res.status(400).send({ msg: 'Query param "lat" or "lon" is missing' })
    return
  }
  const lat: number= parseFloat(req.query['lat']?.toString())
  const lon: number= parseFloat(req.query['lon']?.toString())
  if (lat === undefined || lon === undefined) {
    res.status(400).send({ msg: 'Query param "lat" or "lon" is missing' })
    return
  }
  await parkingOwner.setLocation(email, lat, lon)
  res.status(201).send({ msg: 'Updated' })
}

//___________________________amruta____________

// function to get status of payment for parking lot owner - product owner 

export async function getPaymentStatus(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString();
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error (x-email missing)' });
    return;
  }

  const result = await parkingOwner.fetchPaymentStatus(email);
  if (result.type !== me.NoError) {
    res.status(400).send({ msg: 'Encountered error' });
    return;
  }

  res.status(200).send({ paymentStatus: result.paymentStatus });
}

// usage statistics for parking owners

export async function getUsageStatistics(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString();
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error (x-email missing)' });
    return;
  }

  const result = await parkingOwner.fetchUsageStatistics(email);
  if (result.type !== me.NoError) {
    res.status(400).send({ msg: 'Encountered error' });
    return;
  }

  res.status(200).send({
    totalSessions: result.totalSessions,
    totalRevenue: result.totalRevenue,
    averageDuration: result.averageDuration,
  });
}

// to check if parking lot is full or not

export async function checkAndNotifyParkingLotOccupancy(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString();
  if (email === undefined) {
    res.status(500).send({ msg: 'Internal server error (x-email missing)' });
    return;
  }

  // Fetch parking lot occupancy data
  const result = await parkingOwner.checkParkingLotOccupancy(email);
  if (result.type !== me.NoError) {
    res.status(400).send({ msg: 'Encountered error' });
    return;
  }

  const { totalCapacity, currentOccupancy } = result;

  // Define the threshold for sending alerts (e.g., 90% full)
  const occupancyThreshold = 0.9 * totalCapacity;

  if (currentOccupancy >= occupancyThreshold) {
    // Send alert (e.g., via email, SMS, or push notification)
    const alertMessage = `Your parking lot is about to be full! Current occupancy: ${currentOccupancy}/${totalCapacity}.`;
    console.log(alertMessage); // Replace with actual notification logic

    res.status(200).send({
      msg: "Alert sent",
      alertMessage,
    });
  } else {
    res.status(200).send({
      msg: "No alert needed",
      currentOccupancy,
      totalCapacity,
    });
  }
}

// takes for feedback for that particular owner_email

export async function getFeedbackForOwner(req: Request, res: Response) {
  const parkingOwnerEmail = req.headers['x-email']?.toString();
  if (parkingOwnerEmail === undefined) {
    res.status(500).send({ msg: 'Internal server error (x-email missing)' });
    return;
  }

  const result = await parkingOwner.fetchFeedbackForOwner(parkingOwnerEmail);
  if (result.type !== me.NoError) {
    if (result.type === me.NotExistError) {
      res.status(404).send({ msg: 'No feedback found for this parking owner' });
    } else {
      res.status(500).send({ msg: 'Internal server error' });
    }
    return;
  }

  res.status(200).send({ feedbacks: result.feedbacks });
}

// Add this function to parkingOwner_controller.ts
export async function getDriverFeedbackGet(req: Request, res: Response) {
  const email = req.headers['x-email']?.toString();
  if (email === undefined) {
      res.status(500).send({ msg: 'Internal server error' });
      return;
  }

  const result = await parkingOwner.getDriverFeedback(email);
  if (result.type !== me.NoError) {
      if (result.type === me.NotExistError) {
          res.status(404).send({ msg: 'No feedback found' });
          return;
      } else {
          res.status(500).send({ msg: 'Internal server error' });
          return;
      }
  }

  res.status(200).send({ feedbacks: result.feedbacks });
}

export async function storeParkedLocation(req: Request, res: Response) {
  const { driver_id, latitude, longitude } = req.body;

  if (!driver_id || !latitude || !longitude) {
      res.status(400).json({ message: "Missing required fields" });
      return ;
  }

  const result = await parkingOwner.saveVehicleLocation(driver_id, latitude, longitude);

  if (result.type === "NoError") {
       res.status(200).json({ message: "Vehicle location stored successfully" });
       return;
  }

  res.status(500).json({ message: "Error storing vehicle location" });
  return ;
}

// Get the parked vehicle location
export async function getParkedLocation(req: Request, res: Response) {
  const driverId = parseInt(req.params.driverId, 10);

  if (!driverId) {
      res.status(400).json({ message: "Invalid Driver ID" });
      return ;
  }

  const result = await parkingOwner.getVehicleLocation(driverId);

  if (result.type === "NoError") {
      res.status(200).json({ location: result.data });
      return ;
  }

  res.status(500).json({ message: "Error fetching vehicle location" });
  return ;
}