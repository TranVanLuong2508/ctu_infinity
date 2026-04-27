import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from 'src/modules/events/entities/event.entity';

/**
 * Trạng thái tổng quan của sinh viên đối với một sự kiện.
 *
 * - REGISTERED : Đã đăng ký, chưa điểm danh
 * - CANCELLED  : Đã hủy đăng ký (trước khi sự kiện diễn ra)
 * - ATTENDED   : Đã điểm danh thành công (QR hoặc thủ công bởi admin)
 * - ABSENT     : Sự kiện đã kết thúc nhưng không điểm danh
 */
export enum REGISTRATION_STATUS {
    REGISTERED = 'REGISTERED',
    CANCELLED = 'CANCELLED',
    ATTENDED = 'ATTENDED',
    ABSENT = 'ABSENT',
}

/**
 * Bảng lưu đăng ký tham gia sự kiện của sinh viên.
 * Unique theo (studentId, eventId): mỗi sinh viên chỉ đăng ký 1 lần / 1 sự kiện.
 *
 * Lifecycle:
 *   Đăng ký   → REGISTERED
 *   Hủy       → CANCELLED  (cancelledAt = now)
 *   Điểm danh → ATTENDED   (attendedAt = now)
 *   Vắng mặt  → ABSENT     (sau khi sự kiện kết thúc)
 */
@Entity({ name: 'event_registrations' })
@Index(['studentId', 'eventId'], { unique: true })
export class EventRegistration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    studentId: string;

    @Column({ type: 'uuid' })
    eventId: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId', referencedColumnName: 'eventId' })
    event: Event;

    @Column({
        type: 'enum',
        enum: REGISTRATION_STATUS,
        default: REGISTRATION_STATUS.REGISTERED,
    })
    status: REGISTRATION_STATUS;

    /** Thời điểm đăng ký (tự động gán khi tạo record) */
    @CreateDateColumn()
    registeredAt: Date;

    /** Thời điểm sinh viên điểm danh thành công (QR hoặc thủ công) */
    @Column({ type: 'timestamp', nullable: true })
    attendedAt: Date | null;

    /** Thời điểm sinh viên hủy đăng ký */
    @Column({ type: 'timestamp', nullable: true })
    cancelledAt: Date | null;
}
