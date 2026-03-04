#!/bin/sh
# Install MySQL client
echo 'Installing MySQL client...'
apk add --no-cache mysql-client

echo 'Backup service started. Will run initial backup now, then every 30 days.'

# Wait for database to be ready
echo 'Waiting for database to be ready...'
while ! mysqladmin ping -h database -u root -p${MYSQL_ROOT_PASSWORD} --silent; do
  sleep 2
done

# Infinite loop for backups
while true; do
  # Create backup with timestamp
  BACKUP_FILE="/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
  echo "Starting backup: ${BACKUP_FILE}"
  
  # Perform the backup with SSL disabled
  if mysqldump -h database -u root -p${MYSQL_ROOT_PASSWORD} \
      --ssl=0 \
      --ssl-verify-server-cert=0 \
      ${DB_NAME} > ${BACKUP_FILE}; then
    echo "Backup completed successfully: ${BACKUP_FILE}"
    
    # Compress the backup
    gzip ${BACKUP_FILE}
    echo "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Keep only last 5 backups
    echo "Cleaning up old backups..."
    ls -tp /backups/*.sql.gz 2>/dev/null | grep -v '/$' | tail -n +6 | xargs -I {} rm -- {}
  else
    echo "Backup failed!"
  fi
  
  # Sleep for 30 days
  echo 'Sleeping for 30 days until next backup...'
  sleep 2592000
done