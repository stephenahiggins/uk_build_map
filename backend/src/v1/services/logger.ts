// logger.js
import winston, { format, transports } from 'winston';
import path from 'path';
import { TransformableInfo } from 'logform';

// Define log formats
const logFormat = format.combine(
  format.timestamp(),
  format.json() // Log as JSON for better structure
);
const log_path = path.resolve(__dirname, '../../../');

const consoleFormat = format.combine(
  format.colorize(),
  format.printf((info: TransformableInfo) => {
    // Safely cast message to string for console
    const message =
      typeof info.message === 'string'
        ? info.message
        : JSON.stringify(info.message);
    return `${info.timestamp} [${info.level}]: ${message}${info.stack ? '\n' + info.stack : ''}`;
  })
);

// Create a Winston logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Different log levels for production and development
  format: logFormat,
  transports: [
    // Log to console in development
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    }),
    // Log to file in production
    new winston.transports.File({
      filename: path.join(log_path, 'logs', 'application.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep a maximum of 5 log files
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new transports.Console({
      format: consoleFormat,
    }),
    new transports.File({
      filename: path.join(log_path, 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new transports.Console({
      format: consoleFormat,
    }),
    new transports.File({
      filename: path.join(log_path, 'logs', 'rejections.log'),
    }),
  ],
});
