CREATE TABLE open_activities (
    PRIMARY KEY open_id INT,
    username VARCHAR(50),
    activity varchar(50),
    additional_info varchar(300),
    FOREIGN key user_id
)

CREATE TABLE users (
    PRIMARY KEY user_id INT IDENTITY(1,1) NOT NULL,
    username varchar(50) DISTINCT NOT NULL,
    first_name VARCHAR(50),
    last_name varchar(50),
    img varchar(50)
);