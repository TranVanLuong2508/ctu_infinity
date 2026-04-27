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
 * Trạng thái duyệt điểm danh của sinh viên.
 *
 * - PENDING  : Chờ admin duyệt (khi event.requiresApproval = true)
 * - APPROVED : Đã được duyệt / tự động duyệt (khi event.requiresApproval = false)
 * - REJECTED : Bị từ chối bởi admin
 */
export enum ATTENDANCE_STATUS {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

/**
 * Phương thức điểm danh của sinh viên.
 *
 * - QR     : Sinh viên tự quét QR code
 * - MANUAL : Admin điểm danh thủ công
 */
export enum CHECK_IN_METHOD {
    QR = 'QR',
    MANUAL = 'MANUAL',
}

/**
 * Bảng ghi lại lịch sử check-in của sinh viên tại sự kiện (audit trail).
 * Unique theo (studentId, eventId): mỗi sinh viên chỉ có 1 bản ghi check-in / 1 sự kiện.
 *
 * Bảng này phục vụ cho việc duyệt điểm danh (admin approve/reject).
 * Trạng thái tổng quan của sinh viên được lưu ở event_registrations.
 */
@Entity({ name: 'event_attendances' })
@Index(['studentId', 'eventId'], { unique: true })
export class EventAttendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    studentId: string;

    @Column({ type: 'uuid' })
    eventId: string;

    @ManyToOne(() => Event, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'eventId', referencedColumnName: 'eventId' })
    event: Event;

    /** Thời điểm check-in (tự động gán khi tạo record) */
    @CreateDateColumn()
    checkInTime: Date;

    @Column({
        type: 'enum',
        enum: ATTENDANCE_STATUS,
        default: ATTENDANCE_STATUS.PENDING,
    })
    status: ATTENDANCE_STATUS;

    /**
     * Phương thức điểm danh:
     * - QR     : Sinh viên quét QR code trực tiếp
     * - MANUAL : Admin điểm danh thủ công (dùng khi sinh viên không quét được QR)
     */
    @Column({
        type: 'enum',
        enum: CHECK_IN_METHOD,
        default: CHECK_IN_METHOD.QR,
    })
    checkInMethod: CHECK_IN_METHOD;
}
