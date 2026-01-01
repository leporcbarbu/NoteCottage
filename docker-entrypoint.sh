#!/bin/sh
# Docker entrypoint script for NoteCottage
# Ensures data directories exist and are writable before starting the app

set -e

# Ensure data directory exists
mkdir -p /app/data /app/uploads

# Try to create a test file to verify write permissions
if ! touch /app/data/.write_test 2>/dev/null; then
    echo "ERROR: Cannot write to /app/data directory"
    echo "This usually means the volume has incorrect permissions"
    echo ""
    echo "Fix this by running on your host machine:"
    echo "  mkdir -p ./data ./uploads"
    echo "  chmod 777 ./data ./uploads"
    echo ""
    echo "Or add 'user: \"0:0\"' to your docker-compose.yml (run as root)"
    exit 1
fi

# Clean up test file
rm -f /app/data/.write_test

# Start the application
exec node server.js
