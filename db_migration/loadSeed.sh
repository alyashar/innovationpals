#!/bin/sh
HOST="localhost:27017"
DB="edu_db"

mongoimport -d $DB -c users --drop --file users.json
mongoimport -d $DB -c userroles --drop --file userroles.json
