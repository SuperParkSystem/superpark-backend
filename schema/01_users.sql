\c superpark

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
