docker-compose up -d database

# Check if it's running
docker-compose ps

# Test connection from Ubuntu host
mysql -h 127.0.0.1 -P 3306 -u root -p
# Password: from your .env file (MYSQL_ROOT_PASSWORD)

# Or use Docker exec
docker exec -it one_nbtc_ui_mysql mysql -u root -p
#nbtc2026_lng
# Check databases
SHOW DATABASES;



docker-compose stop database
docker-compose rm -f database


cat onenbtc.sql | docker exec -i one_nbtc_ui_mysql mysql -u root -p