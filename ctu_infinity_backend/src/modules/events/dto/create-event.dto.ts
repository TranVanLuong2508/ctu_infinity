import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator: Kiểm tra registrationDeadline phải sớm hơn startDate
 */
function IsBeforeStartDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBeforeStartDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as CreateEventDto;
          if (!value || !dto.startDate) return true; // skip if either is missing
          return new Date(value) < new Date(dto.startDate);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Hạn chót đăng ký phải sớm hơn thời gian bắt đầu sự kiện';
        },
      },
    });
  };
}

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @IsNotEmpty()
  @IsDateString()
  endDate: Date;

  /**
   * Hạn chót đăng ký sự kiện.
   * Phải sớm hơn startDate.
   */
  @IsOptional()
  @IsDateString()
  @IsBeforeStartDate()
  registrationDeadline?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsUUID()
  organizerId?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  /** true: attendance cần admin duyệt mới cộng điểm. false: cộng điểm ngay khi check-in */
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  /** Học kỳ mà sự kiện thuộc về */
  @IsOptional()
  @IsUUID('4', { message: 'semesterId phải là UUID hợp lệ' })
  semesterId?: string;
}
