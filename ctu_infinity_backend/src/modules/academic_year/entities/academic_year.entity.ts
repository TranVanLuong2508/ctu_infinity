import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AcademicYear {
  @PrimaryGeneratedColumn('uuid')
  yearId: string;

  @Column()
  yearName: string;

  // chỉ lưu ngày
  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'boolean', default: false })
  isCurrent: boolean;
}
