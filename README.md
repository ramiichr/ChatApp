# ChatApp - Real-time Chat Application

A real-time chat application with text, voice, and video capabilities built with React, Node.js, Express, MongoDB, and Socket.io.

## Deployment Instructions for Vercel

This application consists of two parts that need to be deployed separately:

1. Frontend (client)
2. Backend (server)

### Deploying the Backend (Server)

1. Log in to your Vercel account and create a new project
2. Connect your GitHub repository or upload the server directory
3. Configure the following environment variables in Vercel:

   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `CLIENT_URL`: The URL of your deployed frontend (will be available after frontend deployment)
   - `NODE_ENV`: Set to "production"

4. Deploy the server with the following settings:

   - Build Command: `npm install`
   - Output Directory: (leave empty)
   - Install Command: `npm install`
   - Development Command: `npm run dev`

5. After deployment, note the URL of your server (e.g., https://chat-app-server-vercel.vercel.app)

### Deploying the Frontend (Client)

1. Update the `.env.production` file with your deployed server URL:

   ```
   REACT_APP_SERVER_URL=https://your-server-url.vercel.app
   ```

2. Create a new project in Vercel for the frontend
3. Connect your GitHub repository or upload the client directory
4. Configure the following environment variables in Vercel:

   - `REACT_APP_SERVER_URL`: The URL of your deployed backend

5. Deploy the client with the following settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
   - Development Command: `npm start`

### Update Backend CORS Settings

After deploying the frontend, you may need to update the CORS settings in the backend to allow connections from your frontend URL. This can be done by:

1. Adding your frontend URL to the `CLIENT_URL` environment variable in the backend Vercel project
2. Redeploying the backend

## Local Development

To run the application locally:

1. Install dependencies:

   ```
   npm run install-all
   ```

2. Start the development server:
   ```
   npm start
   ```

This will start both the client and server in development mode.
