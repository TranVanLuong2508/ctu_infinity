import { Criteria } from 'src/modules/criterias/entities/criteria.entity';
import { AppDataSource } from '../data-source';
import { CRITERIA_DATA } from '../data/criteria';

export async function seedCriterias() {
  const criteriaRepo = AppDataSource.getRepository(Criteria);

  const countCriteriaDataRows = await criteriaRepo.count();

  if (countCriteriaDataRows > 0) {
    console.warn('Database already has Criteria data!');
    return;
  }

  await criteriaRepo.save(CRITERIA_DATA);
  console.log(`Seeded ${CRITERIA_DATA.length} criterias`);
}
