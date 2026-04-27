import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'event_templates' })
export class EventTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    type: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'jsonb', nullable: true, default: [] })
    variables: string[];

    @Column({ nullable: true })
    organizerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
