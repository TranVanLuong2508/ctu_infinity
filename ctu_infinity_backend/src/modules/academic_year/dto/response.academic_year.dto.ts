import { Exclude, Expose } from 'class-transformer';

export class AcademicYearResponseDto {
  @Expose()
  yearId: string;

  @Expose()
  yearName: string;

  @Expose()
  startDate: string;

  @Expose()
  endDate: string;

  @Expose()
  isCurrent: boolean;
}
