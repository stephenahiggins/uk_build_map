import { User } from '../models/user';
import type { MulterFile } from '@/src/common/utils/fileUpload';

declare global {
  namespace Express {
    interface Request {
      profile?: User;
      file?: MulterFile;
    }
  }
}

export {};
