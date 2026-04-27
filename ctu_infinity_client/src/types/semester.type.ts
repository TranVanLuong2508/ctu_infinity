export interface IAcademicYear {
  yearId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ISemester {
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  yearId: string;
  academicYear?: IAcademicYear;
}
