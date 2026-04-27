import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Falculty } from 'src/modules/falculties/entities/falculty.entity';

@Entity({ name: 'majors' })
export class Major {
  @PrimaryGeneratedColumn('uuid')
  majorId: string;

  @Column()
  majorName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  falcultyId: string;

  @ManyToOne(() => Falculty, (falculty) => falculty.majors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'falcultyId' })
  falculty: Falculty;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
