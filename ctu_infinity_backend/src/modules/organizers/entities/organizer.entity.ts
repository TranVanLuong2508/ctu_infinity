import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'organizers' })
export class Organizer {
  @PrimaryGeneratedColumn('uuid')
  organizerId: string;

  @Column()
  organizerName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  user: User;

  // @Column({ type: 'uuid', nullable: true })
  // isActivatedBy: string;
}
