#!/bin/bash

if [ !$NODE_LAUNCH_SCRIPT ]; then
  export NODE_LAUNCH_SCRIPT="app.js"
fi

forever stop $NODE_LAUNCH_SCRIPT
