DROP TABLE IF EXISTS clients;

CREATE TABLE user_accounts
(
    id            UUID PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(250) NOT NULL,
    last_name     VARCHAR(250) NOT NULL,
    email         VARCHAR(250) NOT NULL UNIQUE
);

CREATE TABLE user_watchlist
(
    user_id  UUID   NOT NULL REFERENCES user_accounts (id) ON DELETE CASCADE,
    movie_id BIGINT NOT NULL REFERENCES movies (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, movie_id)
);

CREATE TABLE tickets
(
    id          UUID PRIMARY KEY,
    movie_id    BIGINT         NOT NULL REFERENCES movies (id),
    owner_id    UUID           NOT NULL REFERENCES user_accounts (id),
    price       NUMERIC(10, 2) NOT NULL,
    seat_number INTEGER        NOT NULL,
    date_time   TIMESTAMP
);