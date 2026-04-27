import { BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

export function validateUUID(id: string, fieldName: string = 'id'): void {
  if (!isUUID(id)) {
    throw new BadRequestException({
      EC: 0,
      EM: `${fieldName} must be a valid UUID format`,
    });
  }
}
