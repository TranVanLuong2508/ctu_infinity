import { Falculty } from 'src/modules/falculties/entities/falculty.entity';
import { AppDataSource } from '../data-source';
import { FALCULTIES } from '../data/falculties';

export async function seedFalculties() {
  const falcultyRepo = AppDataSource.getRepository(Falculty);

  const countFalcultyDataRows = await falcultyRepo.count();

  if (countFalcultyDataRows > 0) {
    console.warn('Database already has Falculty data!');
    return;
  }

  await falcultyRepo.save(FALCULTIES);
  console.log(`Seeded ${FALCULTIES.length} falculties`);
}
