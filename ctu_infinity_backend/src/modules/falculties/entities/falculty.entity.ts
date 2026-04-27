import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Major } from 'src/modules/majors/entities/major.entity';

@Entity({ name: 'falculties' })
export class Falculty {
  @PrimaryGeneratedColumn('uuid')
  falcultyId: string;

  @Column()
  falcultyName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Major, (major) => major.falculty)
  majors: Major[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


