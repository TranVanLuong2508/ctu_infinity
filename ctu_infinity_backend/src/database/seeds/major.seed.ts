import { Major } from 'src/modules/majors/entities/major.entity';
import { Falculty } from 'src/modules/falculties/entities/falculty.entity';
import { AppDataSource } from '../data-source';
import { MAJORS_DATA } from '../data/majors';

export async function seedMajors() {
  const majorRepo = AppDataSource.getRepository(Major);
  const falcultyRepo = AppDataSource.getRepository(Falculty);

  const countMajorDataRows = await majorRepo.count();

  if (countMajorDataRows > 0) {
    console.warn('Database already has major data!');
    return;
  }

  // Get all faculties
  const faculties = await falcultyRepo.find();

  if (faculties.length === 0) {
    console.log("Can't create seed major data >> NO FACULTIES FOUND IN DATABASE");
    return;
  }

  const majors: Major[] = [];

  for (const majorData of MAJORS_DATA) {
    const faculty = faculties.find((f) => f.falcultyName === majorData.falcultyName);

    if (faculty) {
      const major = majorRepo.create({
        majorName: majorData.majorName,
        description: majorData.description,
        falcultyId: faculty.falcultyId as string,
      });
      majors.push(major);
    } else {
      console.log(`Faculty not found for major: ${majorData.majorName}`);
    }
  }

  await majorRepo.save(majors);
  console.log(`Seeded ${majors.length} majors successfully`);
}
