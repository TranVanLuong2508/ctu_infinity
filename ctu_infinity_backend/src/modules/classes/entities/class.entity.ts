import { Major } from 'src/modules/majors/entities/major.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'classes' })
export class Class {
    @PrimaryGeneratedColumn('uuid')
    classId: string;

    @Column()
    className: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'uuid', nullable: true })
    majorId: string;

    @ManyToOne(() => Major, { nullable: true })
    @JoinColumn({ name: 'majorId', referencedColumnName: 'majorId' })
    major: Major;

    @Column({ type: 'int' })
    academicYear: number;

    @OneToMany(() => Student, (student) => student.class)
    students: Student[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}

