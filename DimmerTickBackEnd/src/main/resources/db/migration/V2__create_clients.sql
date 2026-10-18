CREATE TABLE clients
(
    id         UUID PRIMARY KEY,
    username   VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(250) NOT NULL,
    last_name  VARCHAR(250) NOT NULL,
    email      VARCHAR(250) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL
);