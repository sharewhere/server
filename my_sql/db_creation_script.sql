# delete the database if it already exists
drop database if exists ShareWhereTest;

# create a new database named project3
create database ShareWhereTest;

#This checks if the user already exists and drops it if
#it does.
#This is a workaround for the lack of "if user exists"
DROP PROCEDURE IF EXISTS ShareWhereTest.drop_user_if_exists ;
DELIMITER $$
CREATE PROCEDURE ShareWhereTest.drop_user_if_exists()
BEGIN
  DECLARE foo BIGINT DEFAULT 0 ;
  SELECT COUNT(*)
  INTO foo
    FROM mysql.user
      WHERE User = 'ShareWhereUser' and  Host = 'localhost';
   IF foo > 0 THEN
         DROP USER 'ShareWhereUser'@'localhost' ;
  END IF;
END ;$$
DELIMITER ;
CALL ShareWhereTest.drop_user_if_exists() ;
DROP PROCEDURE IF EXISTS ShareWhereTest.drop_users_if_exists ;

#Create the ShareWhereUser on your local DB.
CREATE USER 'ShareWhereUser'@'localhost' IDENTIFIED BY 'N3onIc3d';
GRANT ALL ON ShareWhereTest.* TO 'ShareWhereUser'@'localhost';


# switch to the new database
use ShareWhereTest;

create table ranks (
    rank_id         int auto_increment,
    rank_title      varchar(30) not null,
    primary key (rank_id)
);

create table users (
    username varchar(30) not null,
    salt     varchar(20) not null,
    hash_code     varchar(40) not null,
    activation_date date not null,
    last_login      date,
    rank_id         int not null,
    zip_code        varchar(10),
    email_address   varchar(30) not null,
    primary key (username), 
    foreign key (rank_id) references ranks(rank_id)    
);

#hidden, requesting, offering, requested_received_offer, offered_received_request, reserved, lent/borrowed, returned.
create table shareable_states (
    state_id        int auto_increment,
    state_name      varchar(30) not null,
    primary key (state_id)
);

create table shareables (
    shar_id        int auto_increment,
    shar_name      varchar(30) not null,
    description    varchar(500),
    username       varchar(30) not null,
    state_id       int,
    primary key (shar_id),
    foreign key (username) references users(username),
    foreign key (state_id) references shareable_states(state_id)
);

#request/offer, reserved, lent/borrowed, completed
create table transaction_types (
    type_id        int auto_increment,
    type_name      varchar(30) not null,
    primary key (type_id)
);

create table transactions (
	lender         varchar(30) not null,
	borrower       varchar(30) not null,
	shar_id        int not null,
    type_id        int not null
);

create table sessions (
     session_id     varchar(48) not null,
     username       varchar(30) not null,
     primary key (session_id),
     foreign key (username) references users(username)
);


#Dummy data for testing the database

#Create data for ranks table
INSERT INTO ranks (rank_title)
VALUES 
("Newbie"),
("Getting there"),
("Master");

INSERT INTO users 
(username, salt, hash_code, activation_date, last_login, rank_id, zip_code, email_address)
VALUES 
( 'tj', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', CURDATE(), CURDATE(), (SELECT rank_id FROM ranks WHERE rank_title = "Newbie"), '32816', 'c@c.c');

INSERT INTO shareable_states 
(state_name)
VALUES
("hidden"),
("requesting"),
("offering"),
("requested_received_offer"),
("offered_received_request"),
("reserved"),
("lent/borrowed"),
("returned");

INSERT INTO shareables 
(shar_name, description, username, state_id)
VALUES 
('Shovel', 'I need a shovel in order to install sprinkers in my lawn', 'tj', (select state_id from shareable_states where state_name = 'requesting')),
('N64 controller', 'Anybody need this? I know it\'s rare!', 'tj', (select state_id from shareable_states where state_name = 'offering'));

INSERT INTO transaction_types 
(type_name)
VALUES
("request/offer"),
("reserved"),
("lent/borrowed"),
("completed");