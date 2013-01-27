#!/bin/bash

# Suitable for production use, by default
if [ ! $NODE_ENV ]; then
  export NODE_ENV=production
fi

forever start app.js