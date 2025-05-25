import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import * as fs from 'fs';
import { promisify } from 'util';
import { Buffer } from 'buffer';

// Extend Express Request type
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

const unlinkAsync = promisify(fs.unlink);

// Simplified Multer file type
export type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

// File filter to only allow images
const fileFilter = (
  _req: Request,
  file: MulterFile,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer with the storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Function to generate file URL
const getFileUrl = (req: Request, filename: string): string => {
  if (!filename) return '';
  return `${req.protocol}://${req.get('host')}/uploads/${path.basename(filename)}`;
};

// Function to delete file
const deleteFile = (filename: string): Promise<void> => {
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  return unlinkAsync(filePath)
    .then(() => {
      console.log(`Successfully deleted file: ${filename}`);
    })
    .catch((err) => {
      console.error(`Error deleting file ${filename}:`, err);
      throw err;
    });
};

export { upload, getFileUrl, deleteFile };
