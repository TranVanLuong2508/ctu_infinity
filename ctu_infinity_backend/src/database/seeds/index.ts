import { AppDataSource } from '../data-source';
import { seedAcademicYears } from './academic_year.seed';
import { seedCriterias } from './criteria.seed';
import { seedFalculties } from './falculty.seed';
import { seedMajors } from './major.seed';
import { seedSemesters } from './semester.seed';
import { seedUsers } from './user.seed';

async function runSeed() {
  await AppDataSource.initialize();

  console.log('Starting seed data...');

  await seedAcademicYears(20);
  await seedSemesters();
  await seedFalculties();
  await seedMajors();
  await seedUsers();
  await seedCriterias();

  await AppDataSource.destroy();

  console.log('Seeding Data completed');
}

runSeed();
