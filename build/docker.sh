#!/bin/bash

SERVICE_NAME="worker"

# Check that essential env vars are set
[ -z "$TMDB_API_KEY" ] && echo "Error: TMDB_API_KEY not set!" && exit 1;
[ -z "$MONGODB_URI" ] && echo "Error: MONGODB_URI not set!" && exit 1;

# Build our image locally
docker build -t $SERVICE_NAME .

OUT=$?
if [ $? -eq 0 ] ; then
  # Well the build went ok, quietly kill existing instances and re-run
  docker kill $SERVICE_NAME 2>/dev/null || true
  docker rm -f $SERVICE_NAME 2>/dev/null || true
  docker run \
    --detach \
    --restart=on-failure:5 \
    --name $SERVICE_NAME \
    --env TMDB_API_KEY=$TMDB_API_KEY \
    --env MONGODB_URI=$MONGODB_URI \
    $SERVICE_NAME

  echo "Service should now be running..."
  docker ps | grep $SERVICE_NAME
else
  echo "Something actually went wrong. Call devops."
  exit $OUT
fi
