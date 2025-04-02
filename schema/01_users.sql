--\c superpark

CREATE TABLE drivers (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255) NOT NULL,
    balance numeric(10, 2) NOT NULL DEFAULT 100,
    CONSTRAINT drivers_balance CHECK (balance >= 0)
);


CREATE TABLE parking_owners (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255) NOT NULL, 
    lat float,
    lon float,
    payment_policy numeric(10, 2) NOT NULL DEFAULT,
    balance numeric(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE driver_sessions (
    email varchar(255) NOT NULL,
    session_key varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES drivers(email)
);

CREATE TABLE sessions (
    session_id varchar(255) PRIMARY KEY,
    driver_email varchar(255) NOT NULL,
    parking_owner_email varchar(255) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NULL,
    payment_status int NOT NULL DEFAULT 0,
    FOREIGN KEY (driver_email) REFERENCES drivers(email),
    FOREIGN KEY (parking_owner_email) REFERENCES parking_owners(email)
);

CREATE TABLE parking_owners_sessions (
    email varchar(255) NOT NULL,
    session_key varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES parking_owners(email)
);

CREATE TABLE product_owners (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255) NOT NULL
);

CREATE TABLE product_owner_sessions (
    email varchar(255) NOT NULL,
    session_key varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES product_owners(email)
);
--feedback 
CREATE TABLE driver_feedback (
    driver_email VARCHAR(255) NOT NULL, 
    parking_owner_email VARCHAR(255) NOT NULL,
    feedback TEXT, --(can be NULL if only rating is provided)
    rating INT CHECK (rating >= 1 AND rating <= 5), -- Rating provided by the driver (1 to 5)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'addressed', 'resolved')), -- Status of the feedback
    PRIMARY KEY (driver_email, parking_owner_email), 
    FOREIGN KEY (driver_email, parking_owner_email) REFERENCES sessions(driver_email, parkinglot_owner_email) -- Foreign key relationship
);

CREATE TABLE ParkingSlots (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    parking_owner_email VARCHAR(255), -- Foreign key referencing parking_owners table
    slot_number INT,
    is_occupied BOOLEAN DEFAULT FALSE,
    threshold INT NOT NULL DEFAULT 90;
    FOREIGN KEY (parking_owner_email) REFERENCES parking_owners(email)
);

