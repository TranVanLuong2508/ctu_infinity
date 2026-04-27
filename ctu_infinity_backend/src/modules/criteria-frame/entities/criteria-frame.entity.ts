import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';
import { Criteria } from 'src/modules/criterias/entities/criteria.entity';

@Entity({ name: 'criteria_frame' })
export class CriteriaFrame {
    @PrimaryGeneratedColumn('uuid')
    frameworkId: string;

    @Column({ type: 'varchar', length: 200 })
    frameworkName: string;

    @Column({ type: 'varchar', length: 20 })
    version: string;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date | null;

    @Column({
        type: 'enum',
        enum: FrameworkStatus,
        default: FrameworkStatus.DRAFT,
    })
    status: FrameworkStatus;

    @Column({ type: 'boolean', default: false })
    isActive: boolean;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'uuid', nullable: true })
    createdBy: string | null;

    @Column({ type: 'uuid', nullable: true })
    approvedBy: string | null;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Criteria, (criteria) => criteria.framework)
    criterias: Criteria[];
}
