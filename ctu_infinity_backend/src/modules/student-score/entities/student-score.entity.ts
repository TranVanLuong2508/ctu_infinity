import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from 'src/modules/events/entities/event.entity';
import { Semester } from 'src/modules/semesters/entities/semester.entity';

/**
 * Bảng lưu điểm của sinh viên theo từng sự kiện.
 * Không cộng trực tiếp vào bảng Student – mỗi lần cộng tạo 1 record mới ở đây.
 * Logic addScore đảm bảo tổng điểm theo criteria không vượt maxScore.
 */
@Entity({ name: 'student_scores' })
export class StudentScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId', referencedColumnName: 'eventId' })
  event: Event;

  /** criteriaId liên kết với bảng criterias (không dùng FK để tránh circular dep) */
  @Column({ type: 'uuid' })
  criteriaId: string;

  /**
   * Số điểm thực tế được cộng (có thể nhỏ hơn event.score nếu bị cap bởi maxScore)
   */
  @Column({ type: 'int' })
  scoreValue: number;

  /**
   * Học kỳ mà điểm này được ghi nhận (tùy chọn)
   */
  @Column({ type: 'uuid', nullable: true })
  semesterId: string | null;

  @ManyToOne(() => Semester, { nullable: true })
  @JoinColumn({ name: 'semesterId' })
  semester: Semester | null;

  @CreateDateColumn()
  createdAt: Date;
}
