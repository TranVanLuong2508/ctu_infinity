import { Semester } from 'src/modules/semesters/entities/semester.entity';
import { AppDataSource } from '../data-source';
import { AcademicYear } from 'src/modules/academic_year/entities/academic_year.entity';

export async function seedSemesters() {
  const semesterRepo = AppDataSource.getRepository(Semester);
  const academicYearRepo = AppDataSource.getRepository(AcademicYear);

  const countSemesterDataRows = await semesterRepo.count();

  if (countSemesterDataRows > 0) {
    console.warn('Database already has semester data!');
    return;
  }

  const currentAcademicYear = await academicYearRepo.findOne({ where: { isCurrent: true } });

  if (!currentAcademicYear) {
    console.warn("Can't create seed semester data >> NOT FOUND CURRENT YEAR IN DATABASE");
    return;
  }

  const semesters: Semester[] = [];

  const yearStart = parseInt(currentAcademicYear.yearName.split('-')[0]);
  const yearEnd = yearStart + 1;

  const semester1 = semesterRepo.create({
    semesterName: 'Học kỳ 1',
    startDate: new Date(yearStart, 7, 1),
    endDate: new Date(yearStart, 10, 30),
    isCurrent: true,
    yearId: currentAcademicYear.yearId,
  });
  semesters.push(semester1);

  const semester2 = semesterRepo.create({
    semesterName: 'Học kỳ 2',
    startDate: new Date(yearEnd, 11, 1),
    endDate: new Date(yearEnd, 2, 30),
    isCurrent: false,
    yearId: currentAcademicYear.yearId,
  });
  semesters.push(semester2);

  const semester3 = semesterRepo.create({
    semesterName: 'Học kỳ 3',
    startDate: new Date(yearEnd, 3, 1),
    endDate: new Date(yearEnd, 6, 30),
    isCurrent: false,
    yearId: currentAcademicYear.yearId,
  });
  semesters.push(semester3);

  await semesterRepo.save(semesters);
  console.log(
    `Seeded ${semesters.length} semesters for academic year ${currentAcademicYear.yearName}`,
  );
}
