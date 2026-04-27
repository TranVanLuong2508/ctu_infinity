import { User } from 'src/modules/users/entities/user.entity';
import { Class } from 'src/modules/classes/entities/class.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'students' })
export class Student {
    @PrimaryGeneratedColumn('uuid')
    studentId: string;

    @Column({ unique: true })
    studentCode: string;

    @Column({ type: 'uuid' })
    userId: string;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    classId: string;

    @ManyToOne(() => Class, (classEntity) => classEntity.students, {
        nullable: true,
    })
    @JoinColumn({ name: 'classId', referencedColumnName: 'classId' })
    class: Class;

    @Column({ type: 'int' })
    enrollmentYear: number;
}
