#!/bin/bash

(
  cd MLBackend-server/ || exit
  echo "Activating virtual environment and starting Python server..."
  source ./bin/activate
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
	
