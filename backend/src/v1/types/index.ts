import type { Request } from 'express';

// This extends the Express Request type to include the file property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export interface Profile {
  user_id: number;
  user_name: string;
  user_email: string;
  user_password?: string;
  user_refreshToken?: string | null;
  user_type?: string;
}

// RequestWithProfile extends the Express Request type and adds the profile property
export interface RequestWithProfile extends Request {
  profile?: Profile;
}

export interface CustomError extends Error {
  // You can add more properties if needed
  statusCode?: number;
}
