\c superpark

CREATE TABLE drivers (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255)
);

CREATE TABLE driver_sessions (
    email varchar(255),
    session_key varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES drivers(email)
);

CREATE TABLE sessions (
    driver_email varchar(255),
    parking_owner_email varchar(255),
    start_time timestamp with time zone,
    end_time timestamp with time zone NULL
);

CREATE TABLE parking_owners (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255),
    lat float,
    long float
);

CREATE TABLE parking_owners_sessions (
    email varchar(255),
    session_key varchar(255) PRIMARY KEY,
    FOREIGN KEY (email) REFERENCES parking_owners(email)
);

CREATE TABLE product_owners (
    email varchar(255) PRIMARY KEY,
    password_hash varchar(255)
);

