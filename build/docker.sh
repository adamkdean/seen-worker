#!/bin/bash

# Check that essential env vars are set
[ -z "$TMDB_API_KEY" ] && echo "Error: TMDB_API_KEY not set!" && exit 1;
[ -z "$MONGODB_URI" ] && echo "Error: MONGODB_URI not set!" && exit 1;

docker kill worker 2>/dev/null || true
docker rm -f worker 2>/dev/null || true
docker run \
  --detach \
  --restart=on-failure:5 \
  --name worker \
  --env TMDB_API_KEY=$TMDB_API_KEY \
  --env MONGODB_URI=$MONGODB_URI \
  quay.io/seenproject/worker
