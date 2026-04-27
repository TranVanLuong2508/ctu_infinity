import { AcademicYear } from 'src/modules/academic_year/entities/academic_year.entity';
import { AppDataSource } from '../data-source';

export async function seedAcademicYears(total = 10) {
  const academicYearRepo = AppDataSource.getRepository(AcademicYear);

  //tránh seed trùng
  const count = await academicYearRepo.count();
  if (count > 0) {
    console.warn('Academic year table already has data');
    return;
  }

  const years: AcademicYear[] = [];

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5; // Start from 5 years ago

  for (let i = 0; i < total; i++) {
    const yearStart = startYear + i;
    const yearEnd = yearStart + 1;

    const startDate = new Date(yearStart, 7, 1);
    const endDate = new Date(yearEnd, 6, 30);

    const academicYear = academicYearRepo.create({
      yearName: `${yearStart}-${yearEnd}`,
      startDate: startDate,
      endDate: endDate,
      isCurrent: i === 4,
    });

    years.push(academicYear);
  }

  await academicYearRepo.save(years);
  console.warn(`Seeded ${total} academic years`);
}
