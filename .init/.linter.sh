#!/bin/bash
cd /home/kavia/workspace/code-generation/javascript-playground-1092-1101/js_playground_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

