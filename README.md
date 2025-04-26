# ChatApp - Real-time Chat Application

A feature-rich real-time chat application with text, voice, and video capabilities built with modern web technologies.

![ChatApp](https://via.placeholder.com/800x400?text=ChatApp+Screenshot)

## Features

- **Real-time Messaging**: Instant message delivery using Socket.io
- **User Authentication**: Secure login and registration system
- **Voice & Video Calls**: One-on-one voice and video communication
- **Responsive Design**: Works on desktop and mobile devices
- **User Status**: See who's online in real-time
- **Message History**: Access your conversation history anytime

## Tech Stack

### Frontend

- **React**: UI library for building the user interface
- **Socket.io Client**: For real-time bidirectional communication
- **React Router**: For navigation between pages
- **Axios**: For HTTP requests to the backend API
- **TailwindCSS**: For styling and responsive design

### Backend

- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **Socket.io**: For real-time bidirectional event-based communication
- **MongoDB**: NoSQL database for storing user data and messages
- **Mongoose**: MongoDB object modeling for Node.js
- **JWT**: For secure authentication
- **bcrypt**: For password hashing

## Project Structure

```
ChatApp/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   ├── src/                # Source files
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── utils/          # Utility functions
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # TailwindCSS configuration
│
├── server/                 # Backend Node.js application
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── socket/             # Socket.io event handlers
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
│
└── package.json            # Root package.json for running both client and server
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation

### Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/chatapp.git
   cd chatapp
   ```

2. **Environment Variables**

   Create a `.env` file in the server directory:

   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

   Create a `.env` file in the client directory:

   ```
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

3. **Install dependencies**

   ```bash
   npm run install-all
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

   This will start both the client (on port 3000) and server (on port 5000) in development mode.

5. **Access the application**

   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Users

- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users

### Conversations

- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id` - Get a specific conversation with messages

## Socket.io Events

### Client to Server

- `message:send` - Send a new message
- `call:start` - Initiate a call
- `call:accept` - Accept an incoming call
- `call:reject` - Reject an incoming call
- `call:end` - End an ongoing call
- `call:offer` - Send WebRTC offer
- `call:answer` - Send WebRTC answer
- `call:ice-candidate` - Send ICE candidate

### Server to Client

- `message:received` - Receive a new message
- `users:online` - Get list of online users
- `call:incoming` - Receive an incoming call
- `call:accepted` - Call was accepted
- `call:rejected` - Call was rejected
- `call:ended` - Call was ended
- `call:offer` - Receive WebRTC offer
- `call:answer` - Receive WebRTC answer
- `call:ice-candidate` - Receive ICE candidate
- `call:error` - Call-related error

## Deployment Instructions

This application consists of two parts that need to be deployed separately:

1. Frontend (client)
2. Backend (server)

### Deploying the Backend (Server) to Vercel

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

### Deploying the Frontend (Client) to Vercel

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

## Troubleshooting

### Common Issues

1. **Connection Issues**

   - Ensure MongoDB is running and accessible
   - Check that the MONGODB_URI is correct
   - Verify that the server is running on the expected port

2. **Authentication Problems**

   - Make sure JWT_SECRET is properly set
   - Check that the token is being properly stored and sent with requests

3. **WebRTC Call Issues**
   - Ensure your browser supports WebRTC
   - Check that you've granted necessary permissions for camera and microphone
   - Try using a different browser if issues persist

### Debugging

- Check the browser console for frontend errors
- Review server logs for backend issues
- Use the `/health` endpoint to check server status and configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Socket.io for the real-time communication library
- MongoDB Atlas for database hosting
- Vercel for application hosting
