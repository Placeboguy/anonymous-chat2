# Vercel Deployment for Anonymous Chat App

This repository contains both the frontend (React) and backend (Node.js/Express/Socket.IO) for an anonymous chat app.

## How to Deploy on Vercel

### 1. Frontend (React)
- Push the `client` folder to GitHub.
- On Vercel, import your GitHub repo and set the project root to `client`.
- Vercel will auto-detect React and build the app from the `build` folder.

### 2. Backend (Node.js)
- Vercel is not recommended for persistent WebSocket servers. Deploy the `server` folder to Render, Heroku, or similar Node.js hosting.
- Get the public URL of your backend.
- In `client/src/App.js`, update the Socket.IO URL to your backend's public URL.

### 3. Update Socket.IO URL
Edit `client/src/App.js`:
```js
const socket = io('https://your-backend-url.com');
```

### 4. Push to GitHub
- Commit all files and push to your GitHub repository.

### 5. Deploy on Vercel
- Import your repo on Vercel and deploy the frontend.

## Notes
- The backend must be running and accessible from the frontend for chat to work.
- For local development, use `npm run dev` from the project root.

## License
MIT
