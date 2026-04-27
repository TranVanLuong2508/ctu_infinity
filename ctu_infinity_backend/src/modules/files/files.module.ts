import { Module } from '@nestjs/common';
import { FileService } from './files.service';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider';
import { FileController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from 'src/config/multer.config';

@Module({
  providers: [FileService, CloudinaryProvider],
  exports: [FileService, CloudinaryProvider],
  controllers: [FileController],
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
  ],
})
export class FilesModule { }
