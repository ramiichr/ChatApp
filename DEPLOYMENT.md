# ChatApp Deployment Guide for Vercel

This guide provides step-by-step instructions for deploying the ChatApp on Vercel.

## Prerequisites

1. A Vercel account
2. A MongoDB Atlas account with a database set up
3. Git repository with your code

## Deployment Steps

### Step 1: Deploy the Backend (Server)

1. Push your code to GitHub or use Vercel CLI for direct upload
2. Log in to your Vercel account and create a new project
3. Connect your GitHub repository and select the `/server` directory as the root
4. Configure the following environment variables in Vercel:

   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: The URL of your frontend (after deployment)

5. Set the build settings:

   - Build Command: `npm install`
   - Output Directory: (leave empty)
   - Install Command: `npm install`
   - Root Directory: `server`

6. Deploy the server and note the URL (e.g., `https://chat-app-server-vercel.vercel.app`)

### Step 2: Deploy the Frontend (Client)

1. Create a new project in Vercel
2. Connect your GitHub repository and select the `/client` directory as the root
3. Configure the environment variable:

   - `REACT_APP_SERVER_URL`: Your deployed server URL (e.g., `https://chat-app-server-vercel.vercel.app`)

4. Set the build settings:

   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
   - Root Directory: `client`

5. Deploy the client and note the URL (e.g., `https://chat-app-client-vercel.vercel.app`)

### Step 3: Update Backend CORS Settings

1. Go back to your server project in Vercel
2. Update the `CLIENT_URL` environment variable with your deployed frontend URL
3. Redeploy the server

## Troubleshooting

If you encounter issues with login or registration:

1. **Check CORS Configuration**: Make sure the server's CORS settings allow requests from your client domain.

2. **Verify Environment Variables**: Ensure that `REACT_APP_SERVER_URL` in the client points to the correct server URL.

3. **Check Network Requests**: Use browser developer tools to inspect network requests and identify any errors.

4. **Test API Endpoints**: Try accessing the `/api/test` endpoint directly in your browser to verify the API is working.

5. **Check MongoDB Connection**: Ensure your MongoDB Atlas cluster is configured to accept connections from Vercel's IP addresses.

6. **Review Logs**: Check the Vercel deployment logs for both client and server for any errors.

## Updating Your Deployment

When you make changes to your code:

1. Push the changes to your GitHub repository
2. Vercel will automatically redeploy your application

For manual redeployment:

1. Go to your project in the Vercel dashboard
2. Click on "Deployments"
3. Click "Redeploy" on the latest deployment
