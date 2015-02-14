# delete the database if it already exists
drop database if exists ShareWhereTest;

# create a new database named project3
create database ShareWhereTest;

# switch to the new database
use ShareWhereTest;

# create the schemas for the four relations in this database
create table users (
    username varchar(30) not null,
    password varchar(128) not null,
    salt     varchar(20) not null,
    activation_date date not null,
    last_login      date,
    rank_id         int not null,
    zip_code        varchar(10),
    email_address   varchar(30) not null,
    primary key (username), 
    foreign key (rank_id) references ranks(rank_id)    
);

create table ranks (
    rank_id         int auto_increment,
    rank_title      varchar(30) not null,
    primary key (rank_id)
);

create table shareables (
	shar_id        int auto_increment,
    shar_name      varchar(30) not null,
    description    varchar(500),
    username       varchar(30) not null,
    primary key (shar_id),
    foreign key (username) references users(username)
);

#exposed, requested, negotiating, shared, unavailable.
create table shareable_state (
	state_id        int auto_increment,
    state_name      varchar(30) not null,
    primary key (state_id)
);

#create table transactions (
#	state_name
#);

create table sessions (
     session_id     varchar(48) not null,
     username       varchar(30) not null,
     primary key (session_id),
     foreign key (username) references users(username)
);