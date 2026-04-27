import { EventCategory } from 'src/modules/event_category/entities/event_category.entity';
import { Organizer } from 'src/modules/organizers/entities/organizer.entity';
import { Semester } from 'src/modules/semesters/entities/semester.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Criteria } from 'src/modules/criterias/entities/criteria.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EVENT_STATUS {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column()
  eventName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  /**
   * Hạn chót đăng ký sự kiện.
   * Sinh viên không thể đăng ký sau thời điểm này.
   * Phải sớm hơn startDate.
   */
  @Column({ type: 'timestamp', nullable: true })
  registrationDeadline: Date;

  @Column({ nullable: true })
  maxParticipants: number;

  @Column({ unique: true })
  eventSlug: string;

  @Column({ nullable: true })
  posterUrl: string;

  @Column({
    type: 'enum',
    enum: EVENT_STATUS,
    default: EVENT_STATUS.DRAFT, // Organizer tạo → DRAFT, sau đó đăng ký duyệt → PENDING
  })
  status: EVENT_STATUS;

  /**
   * Liên kết tiêu chí mà sự kiện này sẽ cộng điểm vào.
   * Null khi chưa được admin duyệt.
   */
  @Column({ nullable: true, type: 'uuid' })
  criteriaId: string | null;

  @ManyToOne(() => Criteria, { nullable: true })
  @JoinColumn({ name: 'criteriaId' })
  criteria: Criteria | null;

  /**
   * Số điểm sự kiện mang lại. Null khi chưa được duyệt.
   * Không được vượt quá Criteria.maxScore (validate lúc approveEvent).
   */
  @Column({ type: 'int', nullable: true })
  score: number | null;

  /**
   * Nếu true: check-in tạo attendance status=PENDING, cần admin duyệt mới cộng điểm.
   * Nếu false: check-in tạo attendance status=APPROVED và cộng điểm ngay.
   */
  @Column({ default: false })
  requiresApproval: boolean;

  /**
   * Quan hệ many-to-many với EventCategory
   * Một sự kiện có thể thuộc nhiều danh mục
   */
  @ManyToMany(() => EventCategory, { nullable: true })
  @JoinTable({
    name: 'event_categories_mapping',
    joinColumn: { name: 'eventId', referencedColumnName: 'eventId' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'categoryId' },
  })
  categories: EventCategory[];

  @Column({ nullable: true })
  organizerId: string;

  @ManyToOne(() => Organizer, { nullable: true })
  @JoinColumn({ name: 'organizerId' })
  organizer: Organizer;

  /**
   * User ID của người tạo sự kiện
   */
  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User | null;

  /**
   * User ID của admin duyệt sự kiện (khi chuyển từ PENDING → APPROVED)
   */
  @Column({ type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver: User | null;

  /**
   * Thời điểm admin duyệt sự kiện
   */
  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  /**
   * Học kỳ mà sự kiện thuộc về (tùy chọn)
   */
  @Column({ type: 'uuid', nullable: true })
  semesterId: string | null;

  @ManyToOne(() => Semester, { nullable: true })
  @JoinColumn({ name: 'semesterId' })
  semester: Semester | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
