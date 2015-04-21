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
    rank_threshold  int,
    primary key (rank_id)
);

create table users (
    username varchar(30) not null,
    salt     varchar(20) not null,
    hash_code     varchar(40) not null,
    activation_date date not null,
    last_login      date,
    zip_code        varchar(10),
    email_address   varchar(30) not null,
    points          int not null DEFAULT 0,
    primary key (username)
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
    creation_date datetime not null DEFAULT CURRENT_TIMESTAMP,
    shar_pic_name  varchar(255),
    start_date     date,
    end_date       date,
    state_id       int,
    primary key (shar_id),
    foreign key (username) references users(username),
    foreign key (state_id) references shareable_states(state_id),
	UNIQUE (shar_name, username)
);

#request/offer, reserved, lent/borrowed, completed
create table transaction_types (
    type_id        int auto_increment,
    type_name      varchar(30) not null,
    primary key (type_id)
);

create table transactions (
    trans_id       int not null auto_increment,
	lender         varchar(30) not null,
	borrower       varchar(30) not null,
	shar_id        int not null,
    type_id        int not null,
    primary key (trans_id),
    foreign key (type_id) references transaction_types(type_id),
    UNIQUE(lender, borrower, shar_id)
);

create table sessions (
     session_id     varchar(48) not null,
     username       varchar(30) not null,
     primary key (session_id),
     foreign key (username) references users(username)
);


#Dummy data for testing the database

#Create data for ranks table
INSERT INTO ranks (rank_title, rank_threshold)
VALUES 
("Newbie", 0),
("Getting there", 1),
("Master", 8);

INSERT INTO users 
(username, salt, hash_code, activation_date, last_login, zip_code, email_address)
VALUES 
( 'tj', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', CURDATE(), CURDATE(), '32816', 'c@c.c'),
( 'lisa', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', CURDATE(), CURDATE(), '32816', 'cf@c.c'),
( 'jeff', '12345678901234567890', 'fdfd75ed7db53c8c4f44d715bc64e8e8cff070ef', CURDATE(), CURDATE(), '32816', 'd@d.d');

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
("returned"),
("deleted");

INSERT INTO shareables 
(shar_name, description, username, state_id, creation_date)
VALUES 
('Shovel', 'I need a shovel in order to install sprinkers in my lawn', 'tj', (select state_id from shareable_states where state_name = 'requesting'), NOW()),
('N64 controller', 'Anybody need this? I know it\'s rare!', 'tj', (select state_id from shareable_states where state_name = 'offering'), NOW()),
('Wig', 'Have no hair.', 'tj', (select state_id from shareable_states where state_name = 'requesting'), NOW()),
('Map', 'Need to find my path.', 'tj', (select state_id from shareable_states where state_name = 'requesting'), NOW()),
('Toy', 'I wanna have fun.', 'tj', (select state_id from shareable_states where state_name = 'requesting'), NOW()),
('Plane', 'Planes are the best.', 'jeff', (select state_id from shareable_states where state_name = 'offered_received_request'), NOW()),
('Chair', 'Take a seat, this chair is pretty comfy.', 'tj', (select state_id from shareable_states where state_name = 'offering'), NOW()),
('Sunblock', 'I want to go to the pool but I burn easy.', 'jeff', (select state_id from shareable_states where state_name = 'requested_received_offer'), NOW()),
('Headphones', 'jam out', 'tj', (select state_id from shareable_states where state_name = 'requested_received_offer'), NOW());


INSERT INTO transaction_types 
(type_name)
VALUES
("request/offer"),
("reserved"),
("lent/borrowed"),
("completed");

INSERT INTO transactions
(lender, borrower, shar_id, type_id)
values
('jeff', 'tj', (select shar_id from shareables where username = 'jeff' and shar_name = 'Plane'), (select type_id from transaction_types where type_name = 'request/offer')),
('jeff', 'tj', (select shar_id from shareables where username = 'tj' and shar_name = 'Headphones'), (select type_id from transaction_types where type_name = 'request/offer')),
('tj', 'jeff', (select shar_id from shareables where username = 'jeff' and shar_name = 'Sunblock'), (select type_id from transaction_types where type_name = 'request/offer')),
('lisa', 'tj', (select shar_id from shareables where username = 'tj' and shar_name = 'Headphones'), (select type_id from transaction_types where type_name = 'request/offer'));