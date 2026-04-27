import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { Role } from 'src/modules/roles/entities/role.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'role_permmission' })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  rolePermissionId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'permission_id' })
  permissionId: string;

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

  @ManyToOne(() => Role, (role) => role.rolePermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'roleId' })
  role: Role;

  @ManyToOne(() => Permission, (permis) => permis.rolePermission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'permissionId' })
  permission: Permission;
}
