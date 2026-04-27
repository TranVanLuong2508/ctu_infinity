import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'event_category' })
export class EventCategory {
  @PrimaryGeneratedColumn('uuid')
  categoryId: String;

  @Column()
  categoryName: String;

  @Column()
  slug: String;

  @Column()
  description: String;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
