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

export async function createPut(req: Request, res: Response) {
  var email: string | undefined = req.body.email?.toString();
  var password: string | undefined = req.body.password?.toString();

  if (email === undefined || password === undefined) {
      res.status(400)
      res.send({msg: "Missing email or password"})
      return
  }
}
//_________amruta_________

// Function to get parking lot ratings by owner email

// Function to get all parking lot ratings
export async function getParkingLotRatings(req: Request, res: Response) {
    try {
        // Call the model function to get all parking lot ratings
        const result = await productOwner.getParkingLotRatings(); // Ensure the function name matches

        // Handle the response
        if (result.type === "success") {
            res.status(200).json({ data: result.data }); // Send the ratings data
        } else {
            res.status(500).json({ msg: "Error fetching parking lot ratings" }); // Handle errors
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Internal server error" });
    }
}

// Function to get parking lot ratings by owner email
export async function getParkingLotRatingsByOwnerEmail(req: Request, res: Response) {
  try {
      const ownerEmail = req.params.ownerEmail; // Get the owner email from the request params

      // Call the model function to get ratings for the specific owner
      const result = await productOwner.getParkingLotRatingsByOwnerEmail(ownerEmail); // Use productOwner instead of productOwnerModel

      // Handle the response
      if (result.type === "success") {
          res.status(200).json({ data: result.data }); // Send the ratings data
      } else {
          res.status(500).json({ msg: "Error fetching parking lot ratings" }); // Handle errors
      }
  } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "Internal server error" });
  }
}


//visualisation

export const getVisualizationData = async (req: Request, res: Response) => {
  try {
      const { type, timeRange } = req.query;
      let data;
      
      switch (type) {
          case 'occupancy':
              data = await productOwner.getOccupancyData(timeRange as string);
              break;
          case 'revenue':
              data = await productOwner.getRevenueData(timeRange as string);
              break;
          case 'threshold-analysis':
              data = await productOwner.getThresholdAnalysisData();
              break;
          case 'peak-hours':
              data = await productOwner.getPeakHoursData(timeRange as string);
              break;
          default:
              return res.status(400).send("Invalid visualization type");
      }
      
      res.status(200).json(data); // Don't return the response object
    } catch (error) {
      console.error("Error fetching visualization data:", error);
      res.status(500).send("Server error");
  }
};

//threshhold

// In your controller file (e.g., productOwner_controller.ts)
export const getNotifications = async (req: Request, res: Response) => {
  try {
      const email = req.headers['x-email']?.toString();
      
      if (!email) {
          res.status(401).send({ message: 'Missing "x-email" header from middleware' });
          return;
      }
      
      const notifications = await productOwner.getNotifications(email);
      res.status(200).json(notifications);
  } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).send({ message: "Server error" });
  }
};