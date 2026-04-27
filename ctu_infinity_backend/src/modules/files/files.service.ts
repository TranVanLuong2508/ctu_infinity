import { Inject, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary/cloudinary-response';
import fs, { createReadStream } from 'fs';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async uploadFile(file: Express.Multer.File) {
    try {
      const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'ctu-infinity-image',
            public_id: `${Date.now()}-${file.originalname}`,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Upload failed'));
            resolve(result);
          },
        );

        uploadStream.end(file.buffer);
      });

      return {
        EC: 0,
        EM: 'Upload image success',
        url: result.secure_url,
        createdAt: result.created_at,
      };
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error);
      throw new Error('Failed to upload file to Cloudinary.');
    }
  }
}
