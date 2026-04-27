import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AcademicYear } from 'src/modules/academic_year/entities/academic_year.entity';

@Entity({ name: 'semesters' })
export class Semester {
  @PrimaryGeneratedColumn('uuid')
  semesterId: string;

  @Column()
  semesterName: string;

  // chỉ lưu ngày
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ type: 'uuid' })
  yearId: string;

  @ManyToOne(() => AcademicYear)
  @JoinColumn({ name: 'yearId' })
  academicYear: AcademicYear;
}
