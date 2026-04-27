import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';

export const CheckDatabaseConnection = async (app: NestExpressApplication) => {
  const logger = new Logger('Database');
  const dataSource = app.get(DataSource);
  if (dataSource.isInitialized) {
    logger.warn('Database connected successfully!');
    logger.warn(`Database: ${dataSource.options.database}`);
  } else {
    logger.error('Database connection failed!');
  }
};
