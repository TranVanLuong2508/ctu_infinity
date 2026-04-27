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
import { Student } from 'src/modules/students/entities/student.entity';
import { EventCategory } from 'src/modules/event_category/entities/event_category.entity';
import { Criteria } from 'src/modules/criterias/entities/criteria.entity';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  subscriptionId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId', referencedColumnName: 'studentId' })
  student: Student;

  @ManyToMany(() => EventCategory, { eager: true })
  @JoinTable({
    name: 'subscription_categories',
    joinColumn: {
      name: 'subscriptionId',
      referencedColumnName: 'subscriptionId',
    },
    inverseJoinColumn: {
      name: 'categoryId',
      referencedColumnName: 'categoryId',
    },
  })
  categories: EventCategory[];

  @ManyToMany(() => Criteria, { eager: true })
  @JoinTable({
    name: 'subscription_criteria',
    joinColumn: {
      name: 'subscriptionId',
      referencedColumnName: 'subscriptionId',
    },
    inverseJoinColumn: {
      name: 'criteriaId',
      referencedColumnName: 'criteriaId',
    },
  })
  criteria: Criteria[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
