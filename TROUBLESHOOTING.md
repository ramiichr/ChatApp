# ChatApp Troubleshooting Guide

This guide provides solutions for common issues you might encounter when deploying or using the ChatApp.

## Server Error

If you're experiencing a "Server Error" when trying to register or login, follow these steps to diagnose and fix the issue:

### 1. Check MongoDB Connection

The most common cause of server errors is a problem with the MongoDB connection.

**Verify your MongoDB URI:**

- Make sure your MongoDB Atlas cluster is running
- Ensure the username and password in the connection string are correct
- Check that your IP address is whitelisted in MongoDB Atlas
- Verify that the database name in the URI is correct

**Test the connection:**

- Run the test script: `node test-db-connection.js`
- Check the Vercel logs for any MongoDB connection errors

### 2. Check Environment Variables

Make sure all required environment variables are set correctly in Vercel:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Should be set to "production"
- `CLIENT_URL`: URL of your client application

### 3. Check CORS Configuration

If the server is running but the client can't connect:

- Verify that CORS is properly configured to allow requests from your client domain
- Check the browser console for CORS-related errors

### 4. Check API Routes

If specific API endpoints are failing:

- Test the `/api/test` endpoint to verify the API is accessible
- Check the `/health` endpoint to verify the MongoDB connection status
- Look for specific error messages in the Vercel logs

### 5. Vercel Deployment Issues

If the deployment itself is failing:

- Check the Vercel build logs for any errors
- Verify that the vercel.json file is correctly configured
- Try redeploying the application

## Client-Side Issues

If the server is working but the client has issues:

### 1. Check API Configuration

- Verify that the `REACT_APP_SERVER_URL` environment variable is set correctly
- Check the browser console for API request errors
- Verify that the client is making requests to the correct server URL

### 2. Authentication Issues

If you can't log in or register:

- Check the browser console for detailed error messages
- Verify that the JWT token is being stored correctly in localStorage
- Try clearing your browser cache and cookies

### 3. Socket.io Connection Issues

If real-time features aren't working:

- Check the browser console for socket connection errors
- Verify that the socket URL is configured correctly
- Check if the server's socket.io endpoint is accessible

## Getting More Debug Information

To get more detailed error information:

1. Check the Vercel logs for the server application
2. Look at the browser console for client-side errors
3. Use the `/api/test` and `/health` endpoints to check server status
4. Try accessing the API directly using tools like Postman or curl

## Contact Support

If you're still experiencing issues after trying these solutions, please:

1. Gather all relevant error messages from the console and logs
2. Take screenshots of any error screens
3. Document the steps you've taken to troubleshoot
4. Contact support with this information
