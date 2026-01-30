# Stop
docker-compose stop backend
docker-compose rm backend
# clear cache ghosts
docker rmi -f one_nbtc_ui_backend 2>/dev/null || true

# start
docker-compose build --no-cache backend
docker-compose up -d backend

# Check logs
docker-compose logs backend

# Test backend API
curl -v http://localhost:5000
curl -v http://localhost:5000/api/health
curl -v http://localhost:5000/api/test

# Check backend can connect to database
docker exec backend sh -c "nc -zv database 3306"