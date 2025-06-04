#!/bin/bash

(
  cd MLBackend-server/ || exit
  echo "Starting Python server..."
  python3 newserver.py
) &

(
  cd backend-server || exit
  echo "Starting Node backend..."
  node server.js
) &

(
  cd frontend/src || exit
  echo "Starting frontend and opening browser..."
  npm run dev -- --open
  #streamlit run app.py
) &

wait
	
