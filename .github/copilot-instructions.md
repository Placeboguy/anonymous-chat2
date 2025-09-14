# Anonymous Chat App

This project is a simple, deployable anonymous chat system. Users can join and chat in real time without registration.

## How to Run Locally

1. **Install dependencies**
   - Run `npm install` in the project root. This installs dependencies for both server and client.

2. **Start the app**
   - Run `npm run dev` to start both backend and frontend.
   - The server runs on port 5000, and the client runs on port 3000.

3. **Build for production**
   - Run `npm run build` to build the React frontend for deployment.

## Deployment
- Deploy the server (`server` folder) to any Node.js hosting (Heroku, Render, etc.).
- Deploy the client (`client/build` folder) to any static hosting (Vercel, Netlify, etc.).
- Update the Socket.IO server URL in `client/src/App.js` if deploying to a remote server.

## Tech Stack
- Node.js, Express, Socket.IO (backend)
- React (frontend)

## License
MIT