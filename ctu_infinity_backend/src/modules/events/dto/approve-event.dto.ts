import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

/**
 * DTO dùng khi admin duyệt sự kiện.
 * Phải cung cấp criteriaId (tiêu chí cộng điểm) và score (số điểm).
 * score sẽ được validate không vượt Criteria.maxScore trong service.
 */
export class ApproveEventDto {
  @IsNotEmpty()
  @IsUUID()
  criteriaId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'score phải là số nguyên' })
  @Min(0)
  score: number;
}
