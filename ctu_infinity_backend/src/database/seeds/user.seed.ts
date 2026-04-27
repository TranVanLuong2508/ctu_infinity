import { User } from 'src/modules/users/entities/user.entity';
import { AppDataSource } from '../data-source';
import { Role } from 'src/modules/roles/entities/role.entity';
import { BASIC_ROLE } from 'src/constant/role.constant';
import * as bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function seedUsers(total = 10) {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);

  const roleUser = await roleRepo.findOne({ where: { roleName: BASIC_ROLE.normal_user } });
  if (!roleUser) {
    console.log("Role normal_user not found ==> Can't seed user data");
    return;
  }

  const countUserDataRows = await userRepo.find({ where: { roleId: roleUser.roleId } });

  if (countUserDataRows.length > 0) {
    console.warn('Database already has User data!');
    return;
  }

  const defaultPassword = process.env.DEFAULT_PASSWORD || '123456';
  const hashedPassword = await hashPassword(defaultPassword);

  const users: Partial<User>[] = [];
  const genders = ['male', 'female', 'other'];

  for (let i = 1; i <= total; i++) {
    const gender = genders[i % genders.length];
    const user: Partial<User> = {
      email: `user${i}@ctu.edu.vn`,
      fullName: `User ${i}`,
      password: hashedPassword,
      phoneNumber: `09${String(i).padStart(8, '0')}`,
      age: 18 + (i % 10),
      gender: gender,
      birthDate: new Date(2000 + (i % 5), i % 12, (i % 28) + 1),
      roleId: roleUser.roleId,
    };
    users.push(user);
  }

  await userRepo.save(users);
  console.log(`Seeded ${users.length} users`);
}
