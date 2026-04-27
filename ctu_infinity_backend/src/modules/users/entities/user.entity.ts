import { Role } from 'src/modules/roles/entities/role.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { Organizer } from 'src/modules/organizers/entities/organizer.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserGender {
  male = 'male',
  female = 'female',
  other = 'other',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column()
  email: string;

  @Column()
  fullName: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: false })
  phoneNumber: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true, type: 'enum', enum: UserGender })
  gender: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true, default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'roleId' })
  role: Role;

  @OneToOne(() => Student, (student) => student.user, { nullable: true })
  student: Student;

  @OneToOne(() => Organizer, (organizer) => organizer.user, { nullable: true })
  organizer: Organizer;
}
