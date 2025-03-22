import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import type { Request, Response } from "express"; // Use type-only imports
import { getUsageStatistics } from "../controllers/parkingOwner_controller"; // Adjust the import path
import * as parkingOwner from "../models/parkingOwner_model"; // Adjust the import path
import * as me from "../models/errors"; // Adjust the import path

describe("getUsageStatistics", () => {
    let req: Partial<Request>;
    let res: {
        status: (code: number) => any;
        send: (data: any) => any;
    };
    let statusSpy: any;
    let sendSpy: any;
    let fetchUsageStatisticsSpy: any;

    beforeEach(() => {
        // Mock request object
        req = {
            headers: {},
        };

        // Mock response object
        res = {
            status: function (code: number) {
                return this;
            },
            send: function (data: any) {
                return this;
            },
        };

        // Spy on res.status and res.send
        statusSpy = spyOn(res, "status");
        sendSpy = spyOn(res, "send");

        // Spy on the function to be tested
        fetchUsageStatisticsSpy = spyOn(parkingOwner, "fetchUsageStatistics");
    });

    afterEach(() => {
        // Reset the mock implementation after each test
        fetchUsageStatisticsSpy.mockClear(); // Clear call history
    });

    it("should return 500 if x-email header is missing", async () => {
        // Call the function
        await getUsageStatistics(req as Request, res as Response);

        // Verify the response
        expect(statusSpy).toHaveBeenCalledWith(500);
        expect(sendSpy).toHaveBeenCalledWith({ msg: "Internal server error (x-email missing)" });
    });

    it("should return 400 if fetchUsageStatistics encounters an error", async () => {
        // Mock the request with x-email header
        req.headers = { "x-email": "test@example.com" };

        // Mock the error response
        fetchUsageStatisticsSpy.mockResolvedValue({
            type: me.SomeError, // Use SomeError from the errors module
        });

        // Call the function
        await getUsageStatistics(req as Request, res as Response);

        // Verify the response
        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(sendSpy).toHaveBeenCalledWith({ msg: "Encountered error" });
    });

    it("should return 200 with usage statistics on success", async () => {
        // Mock the request with x-email header
        req.headers = { "x-email": "test@example.com" };

        // Mock the successful response
        const mockData = {
            totalSessions: 10,
            totalRevenue: 1000,
            averageDuration: 30,
        };
        fetchUsageStatisticsSpy.mockResolvedValue({
            type: me.NoError, // Use NoError from the errors module
            ...mockData,
        });

        // Call the function
        await getUsageStatistics(req as Request, res as Response);

        // Verify the response
        expect(statusSpy).toHaveBeenCalledWith(200);
        expect(sendSpy).toHaveBeenCalledWith({
            totalSessions: mockData.totalSessions,
            totalRevenue: mockData.totalRevenue,
            averageDuration: mockData.averageDuration,
        });
    });
});
