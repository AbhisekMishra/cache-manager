import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export const logCacheOperation = (operation: string, key: string, success: boolean, duration: number, error?: Error) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    key,
    success,
    requestTime: timestamp,
    processingTimeMs: duration,
    totalTimeMs: duration,
    status: success ? 'success' : 'failed',
    ...(error && { error: error.message, stack: error.stack })
  };

  if (success) {
    logger.info(`Cache ${operation} operation completed in ${duration}ms`, logData);
  } else {
    logger.error(`Cache ${operation} operation failed after ${duration}ms`, logData);
  }
};

export const logProviderSwitch = (from: string, to: string, reason: string) => {
  const timestamp = new Date().toISOString();
  const switchTime = Date.now();
  logger.warn('Cache provider fallback', {
    timestamp,
    from,
    to,
    reason,
    switchTime,
    event: 'provider_switch'
  });
};

export const logInitialization = (provider: string, success: boolean, error?: Error) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    provider,
    success,
    initializationTime: timestamp,
    event: 'initialization',
    ...(error && { error: error.message, stack: error.stack })
  };

  if (success) {
    logger.info('Cache provider initialized', logData);
  } else {
    logger.error('Cache provider initialization failed', logData);
  }
};

export default logger;