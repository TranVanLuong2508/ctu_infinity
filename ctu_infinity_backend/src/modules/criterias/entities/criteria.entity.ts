import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CriteriaFrame } from 'src/modules/criteria-frame/entities/criteria-frame.entity';

@Entity({ name: 'criterias' })
@Index(['criteriaCode', 'frameworkId'], { unique: true })
export class Criteria {
  @PrimaryGeneratedColumn('uuid')
  criteriaId: string;

  @Column()
  criteriaCode: string;

  @Column()
  criteriaName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  maxScore: number | null;

  @Column({ nullable: true })
  parentId: string | null;

  @Column({ type: 'uuid' })
  frameworkId: string;

  @ManyToOne(() => Criteria, (criteria) => criteria.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId', referencedColumnName: 'criteriaId' })
  parent: Criteria | null;

  @OneToMany(() => Criteria, (criteria) => criteria.parent)
  children: Criteria[];

  @ManyToOne(() => CriteriaFrame, (framework) => framework.criterias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'frameworkId', referencedColumnName: 'frameworkId' })
  framework: CriteriaFrame;

  @Column({ type: 'int', default: 1 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
