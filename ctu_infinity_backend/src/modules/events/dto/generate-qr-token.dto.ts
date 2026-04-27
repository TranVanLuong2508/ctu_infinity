import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateQrTokenDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440) // Tối đa 24 giờ
  expiresInMinutes?: number = 120; // Mặc định 2 giờ
}
