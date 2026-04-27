import { IsEnum, IsNotEmpty } from 'class-validator';
import { EVENT_STATUS } from '../entities/event.entity';

export class UpdateEventStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(EVENT_STATUS, { message: 'Invalid status value' })
  status: EVENT_STATUS;
}
