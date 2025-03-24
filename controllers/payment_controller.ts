import express from "express";
import type { Request, Response } from "express";
import * as payment from "../models/payment_model";
import * as me from "../models/errors";

export async function fetchPaymentStatus(req: Request, res: Response) {
    const email = req.headers["x-email"]?.toString();
    if (!email) {
        res.status(400).send({ msg: "Missing 'x-email' header" });
        return;
    }

    try {
        const status = await payment.getPaymentStatus(email);
        if (status.type !== me.NoError) {
            res.status(404).send({ msg: "Parking lot owner not found" });
            return;
        }

        res.status(200).send({
            email: status.email,
            balance: status.balance,
            payment_due: status.payment_due,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ msg: "Server error" });
    }
}