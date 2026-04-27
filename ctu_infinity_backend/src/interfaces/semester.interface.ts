export interface ISemester {
  semesterId?: string;
  semesterName: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  yearId: string;
}
