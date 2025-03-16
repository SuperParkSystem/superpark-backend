import express from "express";
import type { Request, Response } from "express";
import db from "../database"; // Ensure correct DB connection
import * as me from "../models/errors";

const PENALTY_RATE = 5; // Amount per extra minute
const TIME_LIMIT = 120; // Allowed time in minutes

export async function checkPenalty(req: Request, res: Response) {
    const email = req.headers["x-email"]?.toString();
    if (!email) {
        res.status(400).send({ msg: "Missing 'x-email' header" });
        return;
    }

    try {
        const session = await db("sessions")
            .where({ driver_email: email })
            .andWhere("end_time", null) // Active session
            .first();

        if (!session) {
            res.status(404).send({ msg: "No active session found" });
            return;
        }

        const startTime = new Date(session.start_time);
        const currentTime = new Date();
        const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000); // in minutes

        let penalty = 0;
        if (duration > TIME_LIMIT) {
            const excessTime = duration - TIME_LIMIT;
            penalty = excessTime * PENALTY_RATE;
        }

        res.status(200).send({
            session_id: session.session_id,
            start_time: session.start_time,
            duration,
            penalty,
            msg: penalty > 0 ? "Penalty applies" : "Within time limit"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
}

export async function applyPenalty(req: Request, res: Response) {
    const email = req.headers["x-email"]?.toString();
    if (!email) {
        res.status(400).send({ msg: "Missing 'x-email' header" });
        return;
    }

    try {
        const session = await db("sessions")
            .where({ driver_email: email })
            .andWhere("end_time", null)
            .first();

        if (!session) {
            res.status(404).send({ msg: "No active session found" });
            return;
        }

        const startTime = new Date(session.start_time);
        const currentTime = new Date();
        const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000); // in minutes

        let penalty = 0;
        if (duration > TIME_LIMIT) {
            const excessTime = duration - TIME_LIMIT;
            penalty = excessTime * PENALTY_RATE;
        }

        if (penalty > 0) {
            const driver = await db("drivers").where({ email }).first();
            if (!driver) {
                res.status(404).send({ msg: "Driver not found" });
                return;
            }

            const newBalance = driver.balance - penalty;
            await db("drivers").where({ email }).update({ balance: newBalance });

            res.status(200).send({
                session_id: session.session_id,
                duration,
                penalty,
                new_balance: newBalance,
                msg: "Penalty applied successfully"
            });
        } else {
            res.status(200).send({ msg: "No penalty required" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
}

