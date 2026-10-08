#!/bin/sh
# Aurex API entry point - runs the main server on port 4010
export PORT=4010
exec node server/index.js