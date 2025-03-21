import express from "express";
import type { Request, Response } from "express";
import * as driver from "../models/driver_model"; 
import * as pen from "../models/penalty_model"
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
        const session = await driver.getActiveSession(email);
        if (session.type !== me.NoError) {
            res.status(404).send({ msg: "No active session found" });
            return;
        }

        const startTime = new Date(session.startTime);
        const currentTime = new Date();
        const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000); // Convert to minutes

        let penalty = 0;
        if (duration > TIME_LIMIT) {
            const excessTime = duration - TIME_LIMIT;
            penalty = excessTime * PENALTY_RATE;
        }

        res.status(200).send({
            session_id: session.sessionID,
            start_time: session.startTime,
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
        const session = await driver.getActiveSession(email);
        if (session.type !== me.NoError) {
            res.status(404).send({ msg: "No active session found" });
            return;
        }

        const startTime = new Date(session.startTime);
        const currentTime = new Date();
        const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 60000); // Convert to minutes

        let penalty = 0;
        if (duration > TIME_LIMIT) {
            const excessTime = duration - TIME_LIMIT;
            penalty = excessTime * PENALTY_RATE;
        }

        let penaltyResult

        if (penalty > 0) {
            // ✅ Deduct penalty separately from balance
            penaltyResult = await pen.deductPenalty(email, penalty);
            if (penaltyResult.type !== me.NoError) {
                res.status(500).send({ msg: "Error applying penalty" });
                return;
            }
        } else {

        }
        res.status(200).send({
            session_id: session.sessionID,
            duration,
            penalty,
            new_balance: penalty > 0 ? penaltyResult.new_balance : undefined,
            msg: penalty > 0 ? "Penalty applied successfully" : "No penalty required"
        });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
}

