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
    res.status(400)
    res.send({msg: "Missing fields"})
    return
  }
  console.log("Extracted email and password")
  let salted = await bcrypt.hash(password, DriverSaltRounds)
  let result = await driver.create(email, salted)
  if (result === null || result === undefined) {
      res.status(201) // TODO: check code
      res.send({msg: "Success"})
      return
  } else if (result.type === me.DuplError) {
      res.status(400)
      res.send({msg: "Email already exists"})
      console.log("ERROR: ", result)
  } else if (result.type === me.UnknownError) {
    res.status(500)
    res.send({msg: "Unknown error"})
  }
}

export async function createTokenPost(req : express.Request, res : express.Response) {
    var email = req.body.email
    var password = req.body.password
    if (email === undefined || password === undefined) {
        res.status(400)
        res.send({msg: "Missing fields"})
        return
    }
    const passHashRes = await driver.fetchPass(email)
    if (passHashRes.type != me.NoError) {
        res.status(401)
        res.send({msg: "Not authenticated or unknown error"})
        return
    }
    const passHash = passHashRes.passHash
    if (passHash === undefined) {
        res.status(500)
        res.send({msg: "passhash unexpectedly undefined"})
        return
    }
    console.log("Passhash: ", passHash)
    try {
        if (!await bcrypt.compare(password, passHash)) {
            res.status(401)
            res.send({msg: "Invalid password"})
            return
        }
    } catch (err:any) {
        console.log(err)
        res.status(401)
        res.send({msg: "Error comparing password"})
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
    var email : string | undefined = req.headers['x-email']?.toString()
    var parkingOwner : string | undefined = req.query.parkingOwnerEmail?.toString()
    if (email === undefined) {
        res.status(500)
        res.send({msg: "Missing email header"})
        return
    }
    if (parkingOwner === undefined) {
        res.status(400)
        res.send({msg: "Missing parkingOwnerEmail query param"})
        return
    }
    var result = await driver.startSession(email, parkingOwner)
    if (result.type == me.UnknownError) {
        res.status(501)
        res.send({msg: "Unknown error"})
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
    console.log(result)
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
//______amruta _________________

export async function submitFeedbackPost(req: Request, res: Response) {
    const { driverEmail, parkingOwnerEmail, feedback, rating, status } = req.body;
  
    // Validate input
    if (!driverEmail || !parkingOwnerEmail || !rating || rating < 1 || rating > 5) {
      res.status(400).send({ msg: 'Invalid input: driverEmail, parkingOwnerEmail, and rating (1-5) are required' });
      return;
    }
  
    // Validate status (if provided)
    if (status && !['pending', 'addressed', 'resolved'].includes(status)) {
      res.status(400).send({ msg: 'Invalid status: must be "pending", "addressed", or "resolved"' });
      return;
    }
  
    // Insert feedback into the database
    const result = await driver.insertFeedback(
      driverEmail,
      parkingOwnerEmail,
      feedback || null,
      rating,
      status || 'pending' // Default to 'pending' if status is not provided
    );
  
    if (result.type !== me.NoError) {
      if (result.type === me.DuplError) {
        res.status(400).send({ msg: 'Feedback already submitted for this session' });
      } else {
        res.status(500).send({ msg: 'Internal server error' });
      }
      return;
    }
  
    res.status(201).send({ msg: 'Feedback submitted successfully' });
  }


  //__________ramaswetha____________

  export async function recommendParkingByPrice(req: Request, res: Response) {
    const email = req.headers["x-email"]?.toString();
    if (!email) {
      res.status(500).send({ msg: "Internal server error (x-email missing)" });
      return;
    }
  
    try {
      const result = await driver.fetchRecommendedParking();
      
      if (result.type !== me.NoError) {
        res.status(400).send({ msg: "Encountered error" });
        return;
      }
  
      res.status(200).send({
        recommendedParking: result.parkingLots || [],
      });
  
    } catch (error) {
      console.error("Error fetching recommended parking:", error);
      res.status(500).send({ msg: "Internal server error" });
    }
  }
//nearby parking lot recommendation
  
export async function getRecommendations(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString();
    var lat = parseFloat(req.query.lat as string);
    var lon = parseFloat(req.query.lon as string);

    if (!email) {
        res.status(500).send({ msg: 'Missing "x-email" header from middleware' });
        return;
    }

    if (isNaN(lat) || isNaN(lon)) {
        res.status(400).send({ msg: 'Invalid latitude or longitude' });
        return;
    }

    const result = await driver.getNearbyParkingLots(lat, lon);

    if (result.type === "NoError") {
        res.status(200).send({ parkingLots: result.parkingLots });
    } else {
        res.status(500).send({ msg: 'Unknown error' });
    }
}

//threshhold

export async function setThreshold(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString();
    const { newThreshold } = req.body;

    if (!email) {
        res.status(500).send({ msg: 'Missing "x-email" header from middleware' });
        return;
    }

    if (!newThreshold || newThreshold < 0 || newThreshold > 100) {
        res.status(400).send({ msg: "Invalid threshold value" });
        return;
    }

    const result = await driver.updateThreshold(email, newThreshold);

    if (result.type === "NoError") {
        res.status(200).send({ threshold: result.updatedThreshold });
    } else {
        res.status(500).send({ msg: "Failed to update threshold" });
    }
}

export async function getThresholdAlert(req: Request, res: Response) {
    var email = req.headers['x-email']?.toString();

    if (!email) {
        res.status(500).send({ msg: 'Missing "x-email" header from middleware' });
        return;
    }

    const result = await driver.checkThreshold(email);

    if (result.type === "ThresholdReached") {
        res.status(200).send({ alert: result.msg });
    } else if (result.type === "NoError") {
        res.status(200).send({ msg: result.msg });
    } else {
        res.status(500).send({ msg: "Failed to check threshold" });
    }
}

//nearby parking slots

export const getRates = async (req: Request, res: Response) => {
    try {
        const { driver_lat, driver_lon, max_distance } = req.query;

        if (!driver_lat || !driver_lon || !max_distance) {
            res.status(400).send("Missing required parameters.");
            return; // Don't return the response object
        }

        const rates = await driver.getNearbyParkingRates(Number(driver_lat), Number(driver_lon), Number(max_distance));
        
        res.status(200).json(rates); // Don't return the response object
    } catch (error) {
        console.error("Error fetching parking rates:", error);
        res.status(500).send("Server error"); // Don't return the response object
    }
};

export async function getParkedLocation(req: Request, res: Response) {
    const driverId = parseInt(req.params.driverId, 10);

    if (!driverId) {
        res.status(400).json({ message: "Invalid Driver ID" });
        return;
    }

    const result = await driver.getVehicleLocation(driverId);

    if (result.type === "NoError") {
        res.status(200).json({ location: result.data });
        return;
    }

    res.status(500).json({ message: "Error fetching vehicle location" });
}

