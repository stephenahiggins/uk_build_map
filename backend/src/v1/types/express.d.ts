import { User } from '../models/user'; // Adjust path as needed, or use 'any' if no User type

// This file augments the Express Request type to include 'user'.
declare global {
  namespace Express {
    interface Request {
      profile?: User; // Added for JWT-authenticated profile
    }
  }
}

export {}; // Ensures this file is treated as a module
