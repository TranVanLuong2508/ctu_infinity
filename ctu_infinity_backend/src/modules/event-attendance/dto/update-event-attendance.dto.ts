import { PartialType } from '@nestjs/mapped-types';
import { CreateEventAttendanceDto } from './create-event-attendance.dto';

export class UpdateEventAttendanceDto extends PartialType(CreateEventAttendanceDto) {}
