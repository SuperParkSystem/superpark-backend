import { DatabaseError } from "pg"
import pool from "./connectionPool"
import * as me from "./errors"

export async function createOwner(email: string, passwordHash: string) {
    // Only to be used to create test user
    try {
        await pool.query("INSERT INTO product_owners (email, password_hash) VALUES ($1, $2);", [email, passwordHash])
    } catch (err: any) {
        if (err instanceof DatabaseError) {
            if (err.code == "23505") {
                return {type: me.DuplError}
            } else {
                console.log(err)
                return {type: me.UnknownError}
            }
        } else {
            console.log(err)
            return {type: me.UnknownError}
        }
    }
}

export async function fetchPass(email: string) {
    try {
        var result = await pool.query("SELECT password_hash FROM product_owners WHERE email = $1;", [email])
        if (result.rowCount === null) {
            return {type: me.NotExistError}
        }
        if (result.rowCount < 1) {
            return {type: me.NotExistError}
        }
        console.log("result rows: ")
        console.log(result.rows)
        console.log("done")
        return result.rows[0].password_hash
    } catch (err: any) {
        return {type: me.UnknownError}
    }
}

export async function createToken(email: string, token: string) {
    pool.query("INSERT INTO product_owner_sessions (email, session_key) VALUES ($1, $2);", [email, token])
}

export async function verifyToken(token: string) {
    try {
        var result = await pool.query("SELECT email FROM product_owner_sessions WHERE session_key = $1;", [token])
        if (result.rowCount == null || result.rowCount == 0) {
            return {type: me.NotExistError}
        }
        console.log("Fetched email for token: ", result.rows[0].email)
        return result.rows[0].email
    } catch (err: any) {
        return {type: me.UnknownError}
    }
}

export async function increaseBalance(driverEmail: string, amount: number) {
    try {
        var result = await pool.query("UPDATE drivers SET balance = balance + $1 WHERE email = $2;", [amount, driverEmail])
        if (result.rowCount == null || result.rowCount == 0) {
            return {type: me.NotExistError}
        }
        return {type: me.NoError}
    } catch (err: any) {
        console.log(err)
        return {type: me.UnknownError}
    }
}



// Function to get all parking lot ratings
export async function getParkingLotRatings() {
  try {
    const result = await pool.query(
      `SELECT 
         parking_owner_email,
         AVG(rating) AS average_rating
       FROM driver_feedback
       GROUP BY parking_owner_email;`
    );

    if (result.rowCount === 0) {
      return { type: me.NotExistError };
    }

    return {
      type: me.NoError,
      data: result.rows, // Return all parking lot ratings
    };
  } catch (err: any) {
    console.error("Database error:", err);
    return { type: me.DbError };
  }
}

// Function to get parking lot ratings by owner email
export async function getParkingLotRatingsByOwnerEmail(ownerEmail: string) {
  try {
    const result = await pool.query(
      `SELECT 
         parking_owner_email,
         AVG(rating) AS average_rating
       FROM driver_feedback
       WHERE parking_owner_email = $1
       GROUP BY parking_owner_email;`,
      [ownerEmail]
    );

    if (result.rowCount === 0) {
      return { type: me.NotExistError };
    }

    return {
      type: me.NoError,
      data: result.rows[0], // Return ratings for the specific owner
    };
  } catch (err: any) {
    console.error("Database error:", err);
    return { type: me.DbError };
  }
}


//visualisation

export const getOccupancyData = async (timeRange: string) => {
  let timeFilter = '';
  
  if (timeRange === 'weekly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'7 days\'';
  } else if (timeRange === 'monthly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'30 days\'';
  } else if (timeRange === 'yearly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'1 year\'';
  }
  
  const query = `
      SELECT 
          DATE_TRUNC('day', s.start_time) AS date,
          COUNT(s.session_id) AS total_sessions,
          COUNT(CASE WHEN s.end_time IS NULL THEN 1 END) AS active_sessions
      FROM 
          sessions s
      WHERE 
          s.start_time IS NOT NULL
          ${timeFilter}
      GROUP BY 
          DATE_TRUNC('day', s.start_time)
      ORDER BY 
          date;
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

export const getRevenueData = async (timeRange: string) => {
  let timeGrouping = 'day';
  let timeFilter = '';
  
  if (timeRange === 'weekly') {
      timeFilter = 'AND payment_time >= NOW() - INTERVAL \'7 days\'';
  } else if (timeRange === 'monthly') {
      timeFilter = 'AND payment_time >= NOW() - INTERVAL \'30 days\'';
      timeGrouping = 'week';
  } else if (timeRange === 'yearly') {
      timeFilter = 'AND payment_time >= NOW() - INTERVAL \'1 year\'';
      timeGrouping = 'month';
  }
  
  const query = `
      SELECT 
          DATE_TRUNC('${timeGrouping}', payment_time) AS period,
          SUM(amount) AS total_revenue,
          COUNT(payment_id) AS payment_count
      FROM 
          payments
      WHERE 
          payment_time IS NOT NULL
          ${timeFilter}
      GROUP BY 
          DATE_TRUNC('${timeGrouping}', payment_time)
      ORDER BY 
          period;
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

export const getThresholdAnalysisData = async () => {
  const query = `
      SELECT 
          p.email AS owner_email,
          p.threshold AS set_threshold,
          COUNT(s.session_id) AS current_occupancy,
          ROUND((COUNT(s.session_id)::numeric / p.threshold::numeric) * 100, 2) AS occupancy_percentage
      FROM 
          parking_owners p
      LEFT JOIN 
          sessions s ON p.email = s.parking_owner_email AND s.end_time IS NULL
      GROUP BY 
          p.email, p.threshold
      ORDER BY 
          occupancy_percentage DESC;
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

export const getPeakHoursData = async (timeRange: string) => {
  let timeFilter = '';
  
  if (timeRange === 'weekly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'7 days\'';
  } else if (timeRange === 'monthly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'30 days\'';
  } else if (timeRange === 'yearly') {
      timeFilter = 'AND s.start_time >= NOW() - INTERVAL \'1 year\'';
  }
  
  const query = `
      SELECT 
          EXTRACT(HOUR FROM s.start_time) AS hour_of_day,
          COUNT(s.session_id) AS session_count
      FROM 
          sessions s
      WHERE 
          s.start_time IS NOT NULL
          ${timeFilter}
      GROUP BY 
          EXTRACT(HOUR FROM s.start_time)
      ORDER BY 
          hour_of_day;
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

//threshhold

// In your model file (e.g., driver_model.ts)
export const sendThresholdNotification = async (ownerEmail: string, occupiedSlots: number) => {
  try {
      // Store notification in database for persistence
      const query = `
          INSERT INTO notifications (recipient_email, notification_type, message, is_read, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING notification_id;
      `;
      
      const message = `Threshold Alert: ${occupiedSlots} parking slots are currently occupied, which has reached or exceeded your set threshold.`;
      
      const result = await pool.query(query, [
          ownerEmail, 
          'THRESHOLD_ALERT',
          message,
          false
      ]);
      
      // You could implement real-time notification here with WebSockets if needed
      return {
          success: true,
          notification_id: result.rows[0].notification_id
      };
  } catch (error) {
      console.error("Error sending notification:", error);
      return {
          success: false,
          error: "Failed to send notification"
      };
  }
};

// Add a function to retrieve notifications
export const getNotifications = async (email: string) => {
  try {
      const query = `
          SELECT notification_id, notification_type, message, is_read, created_at
          FROM notifications
          WHERE recipient_email = $1
          ORDER BY created_at DESC;
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows;
  } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
  }
};

//store driver location


// Save the parked vehicle location
