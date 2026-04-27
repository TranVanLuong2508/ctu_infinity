/**
 * ============================================================
 * CTU INFINITY - SEED DEMO DATA
 * ============================================================
 *
 * Mục đích: Tạo dữ liệu demo cho hệ thống CTU Infinity.
 *
 * Ngày demo: 21/04/2026 (07:00 - 15:00 VN)
 *
 * Dữ liệu tạo ra:
 *  1. Sử dụng Academic Year 2025-2026 (ID: 0f2bcc04-b169-45bf-ac3e-f5d2a8be218a)
 *  2. Sử dụng Semester I (ID: 6d155101-0c01-40b0-8d97-5cd84499a9cf) - 08/09/2025 - 21/12/2025
 *  3. Event Categories (5 danh mục)
 *  4. Organizers (Khoa CNTT & TT)
 *  5. Demo Students với email đặc trưng recdemo.*
 *  6. Past Events trong HK I 2025-2026 (đã kết thúc)
 *  7. Future Events mở đăng ký (diễn ra tháng 4-5/2026)
 *  8. Student Scores (DRL HK I 2025-2026)
 *  9. Event Registrations (đa dạng trạng thái)
 * 10. Subscriptions (sở thích theo dõi)
 *
 * Các tài khoản demo:
 *   Email: recdemo.phantrang@ctu.local      | Mật khẩu: 123456
 *   Email: recdemo.trongtin@ctu.local       | Mật khẩu: 123456
 *   Email: recdemo.minhvu@ctu.local         | Mật khẩu: 123456
 *   Email: recdemo.linhchi@ctu.local        | Mật khẩu: 123456
 *   Email: recdemo.hieuvu@ctu.local         | Mật khẩu: 123456
 *   Email: recdemo.thanhtam@ctu.local       | Mật khẩu: 123456
 *
 * ============================================================
 */

import * as bcrypt from 'bcryptjs';
import { Like } from 'typeorm';
import { AppDataSource } from './data-source';
import { BASIC_ROLE } from '../../constant/role.constant';
import { Role } from '../../modules/roles/entities/role.entity';
import { User, UserGender } from '../../modules/users/entities/user.entity';
import { Student } from '../../modules/students/entities/student.entity';
import { EventCategory } from '../../modules/event_category/entities/event_category.entity';
import { Organizer } from '../../modules/organizers/entities/organizer.entity';
import { Criteria } from '../../modules/criterias/entities/criteria.entity';
import { Event, EVENT_STATUS } from '../../modules/events/entities/event.entity';
import {
  EventRegistration,
  REGISTRATION_STATUS,
} from '../../modules/event-registration/entities/event-registration.entity';
import { StudentScore } from '../../modules/student-score/entities/student-score.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { AcademicYear } from '../../modules/academic_year/entities/academic_year.entity';
import { Semester } from '../../modules/semesters/entities/semester.entity';
import { Class } from '../../modules/classes/entities/class.entity';
import { Major } from '../../modules/majors/entities/major.entity';
import { Falculty } from '../../modules/falculties/entities/falculty.entity';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

type StudentKey =
  | 'phantrang' | 'trongtin' | 'minhvu' | 'linhchi' | 'hieuvu' | 'thanhtam'
  | 'anhkhoa' | 'thiha' | 'ductri' | 'myhanh' | 'ductuan' | 'hongnhat'
  | 'thanhnga' | 'vanson' | 'phuongthao' | 'ducthinh' | 'ngoclam'
  | 'quanghai' | 'thuthao' | 'anhduc' | 'thanhvy' | 'ducthao'
  | 'minhtuan' | 'thanhhuong' | 'anhviet' | 'ngocmai' | 'minhtam'
  | 'anhphuong' | 'vietanh' | 'hoailan' | 'sonhung';

type CategoryKey = 'academic' | 'volunteer' | 'culture' | 'sport' | 'leadership';

type EventDefinition = {
  key: string;
  eventName: string;
  slug: string;
  criteriaCode: string;
  categoryKeys: CategoryKey[];
  score: number;
  startDate: Date;
  registrationDeadline: Date;
  endDate: Date;
  maxParticipants: number;
  location: string;
};

type RegistrationDefinition = {
  studentKey: StudentKey;
  eventKey: string;
  status: REGISTRATION_STATUS;
  attendedAt?: Date | null;
  cancelledAt?: Date | null;
};

// ============================================================
// DEMO CONFIGURATION
// ============================================================

const DEMO_EMAIL_PREFIX = 'recdemo';
const DEMO_EVENT_SLUG_PREFIX = 'ctuinf-';
const DEMO_CATEGORY_SLUG_PREFIX = 'ctuinf-cat-';

// ============================================================
// DEMO STUDENTS - Email đặc trưng dễ nhận biết
// ============================================================

interface DemoStudentDef {
  key: StudentKey;
  email: string;
  fullName: string;
  studentCode: string;
  gender: UserGender;
  age: number;
}

const DEMO_STUDENTS: DemoStudentDef[] = [
  {
    key: 'phantrang',
    email: 'recdemo.phantrang@ctu.local',
    fullName: 'Nguyễn Phan Trang',
    studentCode: 'RECDEMO001',
    gender: UserGender.female,
    age: 20,
  },
  {
    key: 'trongtin',
    email: 'recdemo.trongtin@ctu.local',
    fullName: 'Lê Trương Trọng Tín',
    studentCode: 'RECDEMO002',
    gender: UserGender.male,
    age: 21,
  },
  {
    key: 'minhvu',
    email: 'recdemo.minhvu@ctu.local',
    fullName: 'Trần Minh Vũ',
    studentCode: 'RECDEMO003',
    gender: UserGender.male,
    age: 19,
  },
  {
    key: 'linhchi',
    email: 'recdemo.linhchi@ctu.local',
    fullName: 'Phạm Thị Linh Chi',
    studentCode: 'RECDEMO004',
    gender: UserGender.female,
    age: 20,
  },
  {
    key: 'hieuvu',
    email: 'recdemo.hieuvu@ctu.local',
    fullName: 'Vũ Anh Hiếu',
    studentCode: 'RECDEMO005',
    gender: UserGender.male,
    age: 22,
  },
  {
    key: 'thanhtam',
    email: 'recdemo.thanhtam@ctu.local',
    fullName: 'Nguyễn Thanh Tâm',
    studentCode: 'RECDEMO006',
    gender: UserGender.male,
    age: 19,
  },
];

// ============================================================
// VIRTUAL STUDENTS - Ảo, để tạo "cộng đồng" cho CF hoạt động
// Không cần login, chỉ tạo đăng ký để hệ thống CF tìm neighbors
// ============================================================

const VIRTUAL_STUDENTS: DemoStudentDef[] = [
  // Nhóm 1: Yêu thích Học thuật & Nghiên cứu (5 sv)
  { key: 'anhkhoa',   email: 'recdemo.anhkhoa@ctu.local',    fullName: 'Lê Anh Khoa',      studentCode: 'RECDEMO007', gender: UserGender.male,   age: 20 },
  { key: 'thiha',     email: 'recdemo.thiha@ctu.local',      fullName: 'Trần Thị Hà',      studentCode: 'RECDEMO008', gender: UserGender.female, age: 21 },
  { key: 'ductri',    email: 'recdemo.ductri@ctu.local',     fullName: 'Nguyễn Đức Trí',   studentCode: 'RECDEMO009', gender: UserGender.male,   age: 19 },
  { key: 'myhanh',    email: 'recdemo.myhanh@ctu.local',     fullName: 'Phạm Mỹ Hạnh',     studentCode: 'RECDEMO010', gender: UserGender.female, age: 20 },
  { key: 'ductuan',   email: 'recdemo.ductuan@ctu.local',    fullName: 'Hoàng Đức Tuấn',   studentCode: 'RECDEMO011', gender: UserGender.male,   age: 22 },

  // Nhóm 2: Yêu thích Tình nguyện & Cộng đồng (5 sv)
  { key: 'hongnhat',  email: 'recdemo.hongnhat@ctu.local',    fullName: 'Trần Hồng Nhật',   studentCode: 'RECDEMO012', gender: UserGender.male,   age: 21 },
  { key: 'thanhnga',  email: 'recdemo.thanhnga@ctu.local',   fullName: 'Lê Thanh Ngọc Ánh', studentCode: 'RECDEMO013', gender: UserGender.female, age: 20 },
  { key: 'vanson',    email: 'recdemo.vanson@ctu.local',     fullName: 'Đặng Văn Sơn',     studentCode: 'RECDEMO014', gender: UserGender.male,   age: 19 },
  { key: 'phuongthao',email: 'recdemo.phuongthao@ctu.local', fullName: 'Nguyễn Phương Thảo',studentCode: 'RECDEMO015', gender: UserGender.female, age: 20 },
  { key: 'ducthinh',  email: 'recdemo.ducthinh@ctu.local',   fullName: 'Lê Đức Thịnh',     studentCode: 'RECDEMO016', gender: UserGender.male,   age: 21 },

  // Nhóm 3: Yêu thích Văn hóa & Văn nghệ (5 sv)
  { key: 'ngoclam',   email: 'recdemo.ngoclam@ctu.local',    fullName: 'Trần Ngọc Lam',    studentCode: 'RECDEMO017', gender: UserGender.female, age: 19 },
  { key: 'quanghai',  email: 'recdemo.quanghai@ctu.local',   fullName: 'Phạm Quang Hải',   studentCode: 'RECDEMO018', gender: UserGender.male,   age: 20 },
  { key: 'thuthao',   email: 'recdemo.thuthao@ctu.local',    fullName: 'Võ Thu Thảo',      studentCode: 'RECDEMO019', gender: UserGender.female, age: 21 },
  { key: 'anhduc',   email: 'recdemo.anhduc@ctu.local',     fullName: 'Nguyễn Anh Đức',   studentCode: 'RECDEMO020', gender: UserGender.male,   age: 22 },
  { key: 'thanhvy',   email: 'recdemo.thanhvy@ctu.local',    fullName: 'Lê Thanh Vy',      studentCode: 'RECDEMO021', gender: UserGender.female, age: 20 },

  // Nhóm 4: Yêu thích Thể thao (5 sv)
  { key: 'ducthao',   email: 'recdemo.ducthao@ctu.local',    fullName: 'Trần Đức Thảo',    studentCode: 'RECDEMO022', gender: UserGender.male,   age: 19 },
  { key: 'minhtuan',  email: 'recdemo.minhtuan@ctu.local',   fullName: 'Nguyễn Minh Tuấn',  studentCode: 'RECDEMO023', gender: UserGender.male,   age: 21 },
  { key: 'thanhhuong',email: 'recdemo.thanhhuong@ctu.local', fullName: 'Trần Thanh Hương', studentCode: 'RECDEMO024', gender: UserGender.female, age: 20 },
  { key: 'anhviet',   email: 'recdemo.anhviet@ctu.local',    fullName: 'Đặng Anh Việt',   studentCode: 'RECDEMO025', gender: UserGender.male,   age: 22 },
  { key: 'ngocmai',   email: 'recdemo.ngocmai@ctu.local',    fullName: 'Lê Ngọc Mai',     studentCode: 'RECDEMO026', gender: UserGender.female, age: 19 },

  // Nhóm 5: Yêu thích Kỹ năng & Lãnh đạo (5 sv)
  { key: 'minhtam',   email: 'recdemo.minhtam@ctu.local',    fullName: 'Phạm Minh Tâm',    studentCode: 'RECDEMO027', gender: UserGender.male,   age: 20 },
  { key: 'anhphuong', email: 'recdemo.anhphuong@ctu.local',  fullName: 'Bùi Anh Phương',  studentCode: 'RECDEMO028', gender: UserGender.female, age: 21 },
  { key: 'vietanh',   email: 'recdemo.vietanh@ctu.local',    fullName: 'Trần Việt Anh',   studentCode: 'RECDEMO029', gender: UserGender.male,   age: 19 },
  { key: 'hoailan',   email: 'recdemo.hoailan@ctu.local',    fullName: 'Nguyễn Hoài Lan', studentCode: 'RECDEMO030', gender: UserGender.female, age: 20 },
  { key: 'sonhung',   email: 'recdemo.sonhung@ctu.local',    fullName: 'Đỗ Sơn Hùng',    studentCode: 'RECDEMO031', gender: UserGender.male,   age: 22 },
];

// ============================================================
// DEMO CATEGORIES
// ============================================================

interface DemoCategoryDef {
  key: CategoryKey;
  categoryName: string;
  slug: string;
  description: string;
}

const DEMO_CATEGORIES: DemoCategoryDef[] = [
  {
    key: 'academic',
    categoryName: 'Học thuật & Nghiên cứu',
    slug: 'ctuinf-cat-hoc-thuat-nghien-cuu',
    description: 'Danh mục hoạt động học thuật, nghiên cứu khoa học và cuộc thi tri thức',
  },
  {
    key: 'volunteer',
    categoryName: 'Tình nguyện - Cộng đồng',
    slug: 'ctuinf-cat-tinh-nguyen-cong-dong',
    description: 'Danh mục hoạt động tình nguyện, công tác xã hội và phục vụ cộng đồng',
  },
  {
    key: 'culture',
    categoryName: 'Văn hóa - Văn nghệ',
    slug: 'ctuinf-cat-van-hoa-van-nghe',
    description: 'Danh mục hoạt động văn hóa, nghệ thuật, lễ hội và phong trào',
  },
  {
    key: 'sport',
    categoryName: 'Thể thao',
    slug: 'ctuinf-cat-the-thao',
    description: 'Danh mục giải đấu thể thao, phong trào thể lực và sức khỏe',
  },
  {
    key: 'leadership',
    categoryName: 'Kỹ năng - Lãnh đạo',
    slug: 'ctuinf-cat-ky-nang-lanh-dao',
    description: 'Danh mục hoạt động kỹ năng, lãnh đạo, cán bộ lớp và đoàn thể',
  },
];

// ============================================================
// EXISTING ACADEMIC YEAR & SEMESTER IDs (provided by user)
// ============================================================
// Academic Year 2025-2026: 0f2bcc04-b169-45bf-ac3e-f5d2a8be218a
// Semester I (08/09/2025 - 21/12/2025): 6d155101-0c01-40b0-8d97-5cd84499a9cf
const EXISTING_ACADEMIC_YEAR_ID = '0f2bcc04-b169-45bf-ac3e-f5d2a8be218a';
const EXISTING_SEMESTER_ID = '6d155101-0c01-40b0-8d97-5cd84499a9cf';

// Active framework: "Khung tieu chi danh gia ren luyen CTU 2025-2026"
// frameworkId: 4d02de56-a292-4ab3-9f5a-df94529a1f08 (status=ACTIVE, isActive=true)

// Criteria codes and their maxScore from the ACTIVE framework:
const CRITERIA_CODES: Record<string, { criteriaId: string; maxScore: number }> = {
  'I':    { criteriaId: 'ecac4dd1-2a3b-415f-9ba5-d66bee24f704', maxScore: 20 },
  'I.1':  { criteriaId: '4e2f291a-b989-4701-8eeb-54ebd90d265f', maxScore: 5  },
  'I.2':  { criteriaId: '7a4f0d37-2edc-4f96-9211-c319cddc3794', maxScore: 6  },
  'I.3':  { criteriaId: '097e0f5a-3748-4d9f-9bfd-fb8108182342', maxScore: 5  },
  'I.4':  { criteriaId: '3d00fa2c-726a-4043-89b9-00ffe62f9d83', maxScore: 4  },
  'II':   { criteriaId: '90ac0d47-1b2e-401c-b383-1cf2b2a816d3', maxScore: 25 },
  'II.1': { criteriaId: '68f3b2d5-06d2-43be-9ae9-43abc199a620', maxScore: 8  },
  'II.2': { criteriaId: '4e91d891-844c-4f19-bb7b-0b0a36e2baa0', maxScore: 7  },
  'II.3': { criteriaId: '811aec36-90ac-4286-ae06-6e5d926e3f63', maxScore: 5  },
  'II.4': { criteriaId: '92544631-b3c2-405c-af32-dd80e29b517a', maxScore: 5  },
  'III':  { criteriaId: '7e04f9f9-22d7-41d8-b392-e8e072005dd0', maxScore: 25 },
  'III.1':{ criteriaId: 'bb46106e-4dd6-438c-bf21-c87059d31bef', maxScore: 6  },
  'III.2':{ criteriaId: '2c34670d-6772-4edd-8c1f-bdbd0fa7caa9', maxScore: 6  },
  'III.3':{ criteriaId: 'ed8d4027-4996-4362-866e-d62486406f33', maxScore: 6  },
  'III.4':{ criteriaId: '208b88a1-a9c6-4e5a-8ef6-94b31b65ea64', maxScore: 7  },
  'IV':   { criteriaId: '8653aea2-77d2-49c5-8d76-11045fe07a56', maxScore: 25 },
  'IV.1': { criteriaId: '101956fe-5b71-4990-85b2-7bc4d25c579f', maxScore: 10 },
  'IV.2': { criteriaId: '76225869-2c2c-4dfc-802f-5644563948d8', maxScore: 10 },
  'IV.3': { criteriaId: '87ba7ece-df3f-4fa0-9fcf-d8409d77daf7', maxScore: 5  },
  'V':    { criteriaId: '82746cf6-2d21-471e-bd64-e3b3b92a0958', maxScore: 10 },
  'V.1':  { criteriaId: '2d859c58-e32a-4449-a70e-5388bd92fe8f', maxScore: 6  },
  'V.2':  { criteriaId: 'c20b7f90-3f92-4ccb-9abd-49c816cd3226', maxScore: 4  },
};

// ============================================================
// PAST EVENTS (within HK I 2025-2026: 08/09/2025 - 21/12/2025)
// ============================================================

function dateTime(year: number, month: number, day: number, hour: number, min = 0): Date {
  return new Date(year, month - 1, day, hour, min, 0);
}

const PAST_EVENTS: EventDefinition[] = [
  // === THÁNG 9/2025 ===
  {
    key: 'past-workshop-study-methods',
    eventName: 'Workshop Phương pháp học tập hiệu quả cho sinh viên năm nhất',
    slug: 'ctuinf-workshop-phuong-phap-hoc-tap-2025',
    criteriaCode: 'I.1',
    categoryKeys: ['academic'],
    score: 5,
    startDate: dateTime(2025, 9, 15, 8, 0),
    registrationDeadline: dateTime(2025, 9, 14, 23, 59),
    endDate: dateTime(2025, 9, 15, 11, 0),
    maxParticipants: 50,
    location: 'Hội trường A - Khu 2, ĐHCT',
  },
  {
    key: 'past-seminar-ai',
    eventName: 'Hội thảo Ứng dụng Trí tuệ nhân tạo trong học tập và nghiên cứu',
    slug: 'ctuinf-hoi-thao-ung-dung-ai-2025',
    criteriaCode: 'I.2',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateTime(2025, 9, 20, 14, 0),
    registrationDeadline: dateTime(2025, 9, 19, 23, 59),
    endDate: dateTime(2025, 9, 20, 17, 0),
    maxParticipants: 80,
    location: 'Giảng đường B2 - Khu 2, ĐHCT',
  },
  {
    key: 'past-green-campus',
    eventName: 'Chiến dịch Xanh hóa - Dọn dẹp khuôn viên Khu 2',
    slug: 'ctuinf-chien-dich-xanh-hoa-khu-2-2025',
    criteriaCode: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2025, 9, 25, 7, 0),
    registrationDeadline: dateTime(2025, 9, 24, 23, 59),
    endDate: dateTime(2025, 9, 25, 12, 0),
    maxParticipants: 100,
    location: 'Khuôn viên Khu 2, ĐHCT',
  },

  // === THÁNG 10/2025 ===
  {
    key: 'past-citizen-seminar',
    eventName: 'Sinh hoạt công dân - Văn minh học đường và đạo đức sinh viên',
    slug: 'ctuinf-sinh-hoat-cong-dan-van-minh-2025',
    criteriaCode: 'II.2',
    categoryKeys: ['academic'],
    score: 7,
    startDate: dateTime(2025, 10, 5, 8, 0),
    registrationDeadline: dateTime(2025, 10, 4, 23, 59),
    endDate: dateTime(2025, 10, 5, 11, 0),
    maxParticipants: 60,
    location: 'Hội trường C - Khu 2, ĐHCT',
  },
  {
    key: 'past-cultural-night',
    eventName: 'Đêm văn nghệ chào mừng Ngày Phụ nữ Việt Nam 20/10',
    slug: 'ctuinf-dem-van-nghe-20-10-2025',
    criteriaCode: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateTime(2025, 10, 19, 18, 30),
    registrationDeadline: dateTime(2025, 10, 18, 23, 59),
    endDate: dateTime(2025, 10, 19, 22, 0),
    maxParticipants: 200,
    location: 'Sân vận động Khu 2, ĐHCT',
  },
  {
    key: 'past-blood-donation',
    eventName: 'Ngày hội Hiến máu tình nguyện - Mạng sự sống',
    slug: 'ctuinf-ngay-hoi-hien-mau-tinh-nguyen-2025',
    criteriaCode: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2025, 10, 28, 7, 0),
    registrationDeadline: dateTime(2025, 10, 27, 23, 59),
    endDate: dateTime(2025, 10, 28, 13, 0),
    maxParticipants: 150,
    location: 'Trường Cao đẳng Y tế CT',
  },

  // === THÁNG 11/2025 ===
  {
    key: 'past-football-cup',
    eventName: 'Giải bóng đá nam sinh viên Khoa CNTT mở rộng 2025',
    slug: 'ctuinf-giai-bong-da-nam-sinh-vien-2025',
    criteriaCode: 'III.2',
    categoryKeys: ['sport'],
    score: 6,
    startDate: dateTime(2025, 11, 8, 7, 0),
    registrationDeadline: dateTime(2025, 11, 7, 23, 59),
    endDate: dateTime(2025, 11, 8, 17, 0),
    maxParticipants: 120,
    location: 'Sân thể thao Khu 2, ĐHCT',
  },
  {
    key: 'past-research-competition',
    eventName: 'Cuộc thi Nghiên cứu khoa học sinh viên cấp Khoa CNTT',
    slug: 'ctuinf-cuoc-thi-nghien-cuu-khoa-hoc-2025',
    criteriaCode: 'I.2',
    categoryKeys: ['academic', 'leadership'],
    score: 6,
    startDate: dateTime(2025, 11, 15, 8, 0),
    registrationDeadline: dateTime(2025, 11, 14, 23, 59),
    endDate: dateTime(2025, 11, 15, 17, 0),
    maxParticipants: 30,
    location: 'Tầng 3 - Tòa nhà Hành chính',
  },
  {
    key: 'past-traffic-safety',
    eventName: 'Tuyên truyền An toàn giao thông cho sinh viên Khu 2',
    slug: 'ctuinf-tuyen-truyen-an-toan-giao-thong-2025',
    criteriaCode: 'IV.1',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2025, 11, 22, 8, 0),
    registrationDeadline: dateTime(2025, 11, 21, 23, 59),
    endDate: dateTime(2025, 11, 22, 11, 0),
    maxParticipants: 80,
    location: 'Hội trường B - Khu 2, ĐHCT',
  },

  // === THÁNG 12/2025 ===
  {
    key: 'past-leadership-training',
    eventName: 'Tập huấn Kỹ năng lãnh đạo cho cán bộ lớp và chi đoàn',
    slug: 'ctuinf-tap-huan-ky-nang-lanh-dao-2025',
    criteriaCode: 'V.1',
    categoryKeys: ['leadership'],
    score: 6,
    startDate: dateTime(2025, 12, 5, 8, 0),
    registrationDeadline: dateTime(2025, 12, 4, 23, 59),
    endDate: dateTime(2025, 12, 5, 17, 0),
    maxParticipants: 40,
    location: 'Phòng Hội nghị - Khu 2, ĐHCT',
  },
  {
    key: 'past-festival-culture',
    eventName: 'Liên hoan Văn hóa kỷ niệm 52 năm thành lập Bộ Giáo dục và Đào tạo',
    slug: 'ctuinf-lien-hoan-van-hoa-52-nam-2025',
    criteriaCode: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateTime(2025, 12, 12, 7, 0),
    registrationDeadline: dateTime(2025, 12, 11, 23, 59),
    endDate: dateTime(2025, 12, 12, 18, 0),
    maxParticipants: 150,
    location: 'Sân khấu lớn - Khu 2, ĐHCT',
  },
  {
    key: 'past-discipline-campaign',
    eventName: 'Chiến dịch Văn minh học đường - Nâng cao ý thức kỷ luật',
    slug: 'ctuinf-chien-dich-van-minh-hoc-duong-2025',
    criteriaCode: 'II.4',
    categoryKeys: ['academic'],
    score: 5,
    startDate: dateTime(2025, 12, 15, 14, 0),
    registrationDeadline: dateTime(2025, 12, 14, 23, 59),
    endDate: dateTime(2025, 12, 15, 17, 0),
    maxParticipants: 100,
    location: 'Khuôn viên Khu 2, ĐHCT',
  },
];

// ============================================================
// FUTURE EVENTS (Open for registration on 21/04/2026)
// ============================================================

const FUTURE_EVENTS: EventDefinition[] = [
  // === Sự kiện mở đăng ký - tháng 4/2026 ===
  {
    key: 'future-ai-workshop-april',
    eventName: 'Workshop Xây dựng Chatbot AI ứng dụng thực tiễn cho sinh viên',
    slug: 'ctuinf-workshop-xay-dung-chatbot-ai-2026',
    criteriaCode: 'I.2',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateTime(2026, 4, 22, 8, 0),
    registrationDeadline: dateTime(2026, 4, 21, 23, 59),
    endDate: dateTime(2026, 4, 22, 12, 0),
    maxParticipants: 50,
    location: 'Phòng Máy A3 - Khu 2, ĐHCT',
  },
  {
    key: 'future-self-learning-seminar',
    eventName: 'Tọa đàm Kỹ năng tự học và quản lý thời gian hiệu quả cho sinh viên',
    slug: 'ctuinf-toa-dam-ky-nang-tu-hoc-2026',
    criteriaCode: 'I.3',
    categoryKeys: ['academic', 'leadership'],
    score: 5,
    startDate: dateTime(2026, 4, 23, 14, 0),
    registrationDeadline: dateTime(2026, 4, 22, 23, 59),
    endDate: dateTime(2026, 4, 23, 17, 0),
    maxParticipants: 80,
    location: 'Hội trường A - Khu 2, ĐHCT',
  },
  {
    key: 'future-academic-presentation',
    eventName: 'Cuộc thi Thuyết trình học thuật - Academic Pitch 2026',
    slug: 'ctuinf-cuoc-thi-thuyet-trinh-hoc-thuat-2026',
    criteriaCode: 'I.4',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateTime(2026, 4, 24, 8, 0),
    registrationDeadline: dateTime(2026, 4, 23, 23, 59),
    endDate: dateTime(2026, 4, 24, 17, 0),
    maxParticipants: 30,
    location: 'Tầng 4 - Tòa nhà Hành chính',
  },
  {
    key: 'future-campus-culture-day',
    eventName: 'Ngày hội Văn hóa Ứng xử - Cuộc thi Ý tưởng sáng tạo',
    slug: 'ctuinf-ngay-hoi-van-hoa-ung-xu-2026',
    criteriaCode: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateTime(2026, 4, 25, 8, 0),
    registrationDeadline: dateTime(2026, 4, 24, 23, 59),
    endDate: dateTime(2026, 4, 25, 17, 0),
    maxParticipants: 100,
    location: 'Sân khấu lớn - Khu 2, ĐHCT',
  },
  {
    key: 'future-traffic-safety-april',
    eventName: 'Tuyên truyền An toàn giao thông đường bộ cho sinh viên Khu 2',
    slug: 'ctuinf-tuyen-truyen-an-toan-giao-thong-2026',
    criteriaCode: 'IV.1',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2026, 4, 25, 14, 0),
    registrationDeadline: dateTime(2026, 4, 24, 23, 59),
    endDate: dateTime(2026, 4, 25, 17, 0),
    maxParticipants: 60,
    location: 'Hội trường B - Khu 2, ĐHCT',
  },
  {
    key: 'future-art-night-april',
    eventName: 'Đêm nhạc phong trào - Chào mừng Ngày Giải phóng Miền Nam 30/4',
    slug: 'ctuinf-dem-nhac-phong-trao-30-4-2026',
    criteriaCode: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateTime(2026, 4, 29, 18, 0),
    registrationDeadline: dateTime(2026, 4, 28, 23, 59),
    endDate: dateTime(2026, 4, 29, 22, 0),
    maxParticipants: 200,
    location: 'Sân khấu lớn - Khu 2, ĐHCT',
  },
  {
    key: 'future-badminton-cup',
    eventName: 'Giải cầu lông sinh viên Khu 2 mở rộng 2026',
    slug: 'ctuinf-giai-cau-long-sinh-vien-2026',
    criteriaCode: 'III.2',
    categoryKeys: ['sport'],
    score: 6,
    startDate: dateTime(2026, 4, 26, 7, 0),
    registrationDeadline: dateTime(2026, 4, 25, 23, 59),
    endDate: dateTime(2026, 4, 26, 18, 0),
    maxParticipants: 64,
    location: 'Sân cầu lông - Khu 2, ĐHCT',
  },
  {
    key: 'future-community-day',
    eventName: 'Ngày hội Tình nguyện - Phục vụ cộng đồng và từ thiện',
    slug: 'ctuinf-ngay-hoi-tinh-nguyen-2026',
    criteriaCode: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2026, 4, 27, 7, 0),
    registrationDeadline: dateTime(2026, 4, 26, 23, 59),
    endDate: dateTime(2026, 4, 27, 12, 0),
    maxParticipants: 100,
    location: 'Khuôn viên Khu 2, ĐHCT',
  },
  {
    key: 'future-leadership-bootcamp',
    eventName: 'Tập huấn Cán bộ Đoàn - Hội: Kỹ năng lãnh đạo và tổ chức',
    slug: 'ctuinf-tap-huan-can-bo-doan-hoi-2026',
    criteriaCode: 'V.1',
    categoryKeys: ['leadership'],
    score: 6,
    startDate: dateTime(2026, 4, 28, 8, 0),
    registrationDeadline: dateTime(2026, 4, 27, 23, 59),
    endDate: dateTime(2026, 4, 28, 17, 0),
    maxParticipants: 50,
    location: 'Phòng Họp - Khu 2, ĐHCT',
  },
  {
    key: 'future-anti-social-evil',
    eventName: 'Tuyên truyền Phòng chống tệ nạn xã hội trong sinh viên',
    slug: 'ctuinf-tuyen-truyen-phong-chong-te-nan-2026',
    criteriaCode: 'IV.3',
    categoryKeys: ['volunteer'],
    score: 5,
    startDate: dateTime(2026, 4, 29, 8, 0),
    registrationDeadline: dateTime(2026, 4, 28, 23, 59),
    endDate: dateTime(2026, 4, 29, 11, 0),
    maxParticipants: 80,
    location: 'Hội trường C - Khu 2, ĐHCT',
  },
  {
    key: 'future-skill-sharing',
    eventName: 'Chương trình Chia sẻ Kỹ năng làm việc nhóm và giao tiếp hiệu quả',
    slug: 'ctuinf-chia-se-ky-nang-lam-viec-nhom-2026',
    criteriaCode: 'V.2',
    categoryKeys: ['leadership'],
    score: 4,
    startDate: dateTime(2026, 4, 30, 14, 0),
    registrationDeadline: dateTime(2026, 4, 29, 23, 59),
    endDate: dateTime(2026, 4, 30, 17, 0),
    maxParticipants: 40,
    location: 'Phòng Họp - Khu 2, ĐHCT',
  },
  {
    key: 'future-fire-drill',
    eventName: 'Diễn tập Phòng cháy chữa cháy và thoát hiểm cho sinh viên',
    slug: 'ctuinf-dien-tap-pccc-thoat-hiem-2026',
    criteriaCode: 'IV.1',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateTime(2026, 5, 3, 8, 0),
    registrationDeadline: dateTime(2026, 5, 2, 23, 59),
    endDate: dateTime(2026, 5, 3, 11, 0),
    maxParticipants: 100,
    location: 'Sân vận động Khu 2, ĐHCT',
  },
];

// ============================================================
// REGISTRATIONS - Strategic placement for recommendation demo
// ============================================================

const REGISTRATIONS: RegistrationDefinition[] = [
  // ---- PHAN TRANG (phantrang) ----
  // Thiếu nhiều ở I.1, I.2, I.3, II.1, II.2, III.2, III.3, III.4, IV.3, V.1, V.2
  // Đã tham gia: III.1, IV.2
  {
    studentKey: 'phantrang',
    eventKey: 'past-cultural-night',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 10, 19, 22, 0),
  },
  {
    studentKey: 'phantrang',
    eventKey: 'past-blood-donation',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 10, 28, 13, 0),
  },
  {
    studentKey: 'phantrang',
    eventKey: 'past-green-campus',
    status: REGISTRATION_STATUS.ABSENT,
    attendedAt: null,
  },
  // Đăng ký future event đang mở
  {
    studentKey: 'phantrang',
    eventKey: 'future-art-night-april',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  // Hủy đăng ký
  {
    studentKey: 'phantrang',
    eventKey: 'future-community-day',
    status: REGISTRATION_STATUS.CANCELLED,
    cancelledAt: dateTime(2026, 4, 20, 10, 0),
  },

  // ---- TRONG TIN (trongtin) ----
  // Thiếu nhiều ở I.1, I.2, I.3, I.4, III.1, III.2, III.3, IV.1, IV.3, V.1, V.2
  // Đã tham gia: II.2, III.4 (đoàn), IV.2, II.4
  {
    studentKey: 'trongtin',
    eventKey: 'past-citizen-seminar',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 10, 5, 11, 0),
  },
  {
    studentKey: 'trongtin',
    eventKey: 'past-green-campus',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 9, 25, 12, 0),
  },
  {
    studentKey: 'trongtin',
    eventKey: 'past-traffic-safety',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 22, 11, 0),
  },
  {
    studentKey: 'trongtin',
    eventKey: 'past-discipline-campaign',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 12, 15, 17, 0),
  },
  // Đăng ký future
  {
    studentKey: 'trongtin',
    eventKey: 'future-badminton-cup',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  {
    studentKey: 'trongtin',
    eventKey: 'future-leadership-bootcamp',
    status: REGISTRATION_STATUS.REGISTERED,
  },

  // ---- MINH VU (minhvu) ----
  // Thiếu nhiều ở I.1, I.3, I.4, II.1, II.2, II.3, III.1, III.3, III.4, IV.2, IV.3, V.1, V.2
  // Đã tham gia: I.2 (nghiên cứu), III.2 (thể thao)
  {
    studentKey: 'minhvu',
    eventKey: 'past-research-competition',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 15, 17, 0),
  },
  {
    studentKey: 'minhvu',
    eventKey: 'past-football-cup',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 8, 17, 0),
  },
  {
    studentKey: 'minhvu',
    eventKey: 'past-workshop-study-methods',
    status: REGISTRATION_STATUS.ABSENT,
  },
  // Đăng ký future
  {
    studentKey: 'minhvu',
    eventKey: 'future-ai-workshop-april',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  {
    studentKey: 'minhvu',
    eventKey: 'future-traffic-safety-april',
    status: REGISTRATION_STATUS.REGISTERED,
  },

  // ---- LINH CHI (linhchi) ----
  // Thiếu nhiều ở I.1, I.2, I.3, I.4, II.1, II.2, II.3, II.4, IV.1, IV.2, IV.3, V.1, V.2
  // Đã tham gia: III.1, III.2, III.4 (đoàn)
  {
    studentKey: 'linhchi',
    eventKey: 'past-cultural-night',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 10, 19, 22, 0),
  },
  {
    studentKey: 'linhchi',
    eventKey: 'past-football-cup',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 8, 17, 0),
  },
  {
    studentKey: 'linhchi',
    eventKey: 'past-festival-culture',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 12, 12, 18, 0),
  },
  // Đăng ký future
  {
    studentKey: 'linhchi',
    eventKey: 'future-self-learning-seminar',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  {
    studentKey: 'linhchi',
    eventKey: 'future-campus-culture-day',
    status: REGISTRATION_STATUS.REGISTERED,
  },

  // ---- HIEU VU (hieuvu) ----
  // Thiếu nhiều ở I.1, I.2, I.3, I.4, II.1, II.2, II.3, II.4, III.1, III.2, III.3, III.4, IV.3, V.2
  // Đã tham gia: III.2 (thể thao), IV.1, IV.2 (tình nguyện), V.1 (cán bộ)
  {
    studentKey: 'hieuvu',
    eventKey: 'past-football-cup',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 8, 17, 0),
  },
  {
    studentKey: 'hieuvu',
    eventKey: 'past-traffic-safety',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 11, 22, 11, 0),
  },
  {
    studentKey: 'hieuvu',
    eventKey: 'past-blood-donation',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 10, 28, 13, 0),
  },
  {
    studentKey: 'hieuvu',
    eventKey: 'past-leadership-training',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 12, 5, 17, 0),
  },
  // Đăng ký future
  {
    studentKey: 'hieuvu',
    eventKey: 'future-academic-presentation',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  {
    studentKey: 'hieuvu',
    eventKey: 'future-anti-social-evil',
    status: REGISTRATION_STATUS.REGISTERED,
  },

  // ---- THANH TAM (thanhtam) ----
  // Thiếu nhiều ở I.1, I.2, I.3, I.4, II.1, II.2, II.3, II.4, III.1, III.2, III.3, III.4, IV.1, IV.3, V.2
  // Đã tham gia: IV.2, V.1
  {
    studentKey: 'thanhtam',
    eventKey: 'past-green-campus',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 9, 25, 12, 0),
  },
  {
    studentKey: 'thanhtam',
    eventKey: 'past-leadership-training',
    status: REGISTRATION_STATUS.ATTENDED,
    attendedAt: dateTime(2025, 12, 5, 17, 0),
  },
  {
    studentKey: 'thanhtam',
    eventKey: 'past-seminar-ai',
    status: REGISTRATION_STATUS.ABSENT,
  },
  // Đăng ký future
  {
    studentKey: 'thanhtam',
    eventKey: 'future-community-day',
    status: REGISTRATION_STATUS.REGISTERED,
  },
  {
    studentKey: 'thanhtam',
    eventKey: 'future-skill-sharing',
    status: REGISTRATION_STATUS.REGISTERED,
  },
];

// ============================================================
// STUDENT SCORES - Strategic deficits for recommendation demo
// ============================================================

type ScoreRow = {
  studentKey: StudentKey;
  eventKey: string;
  criteriaCode: string;
  scoreValue: number;
};

// Each student has DIFFERENT deficit profiles so recommendation works
const SCORE_ROWS: ScoreRow[] = [
  // === PHAN TRANG ===
  // maxScore I.1=5, I.2=6, III.1=6, III.2=6, IV.2=10
  // Hiện có: III.1=6, IV.2=10 => đã đạt max, không cần thêm
  // Thiếu: I.1(0/5), I.2(0/6), III.2(0/6)
  { studentKey: 'phantrang', eventKey: 'past-cultural-night', criteriaCode: 'III.1', scoreValue: 6 },
  { studentKey: 'phantrang', eventKey: 'past-blood-donation', criteriaCode: 'IV.2', scoreValue: 10 },

  // === TRONG TIN ===
  // maxScore II.2=7, II.4=5, IV.1=10, IV.2=10
  // Hiện có: II.2=7(max), II.4=5(max), IV.1=10(max), IV.2=10(max)
  // => Đạt gần max ở II, IV. Đang thiếu nhiều I, III, V
  { studentKey: 'trongtin', eventKey: 'past-citizen-seminar', criteriaCode: 'II.2', scoreValue: 7 },
  { studentKey: 'trongtin', eventKey: 'past-green-campus', criteriaCode: 'IV.2', scoreValue: 10 },
  { studentKey: 'trongtin', eventKey: 'past-traffic-safety', criteriaCode: 'IV.1', scoreValue: 10 },
  { studentKey: 'trongtin', eventKey: 'past-discipline-campaign', criteriaCode: 'II.4', scoreValue: 5 },

  // === MINH VU ===
  // maxScore I.2=6, III.2=6
  // Hiện có: I.2=6(max), III.2=6(max)
  // => Giỏi nghiên cứu và thể thao. Thiếu nhiều ở các tiêu chí khác
  { studentKey: 'minhvu', eventKey: 'past-research-competition', criteriaCode: 'I.2', scoreValue: 6 },
  { studentKey: 'minhvu', eventKey: 'past-football-cup', criteriaCode: 'III.2', scoreValue: 6 },

  // === LINH CHI ===
  // maxScore III.1=6, III.2=6
  // Hiện có: III.1=6(max), III.2=6(max)
  // => Tham gia văn hóa và thể thao tốt. Thiếu nhiều ở các tiêu chí khác
  { studentKey: 'linhchi', eventKey: 'past-cultural-night', criteriaCode: 'III.1', scoreValue: 6 },
  { studentKey: 'linhchi', eventKey: 'past-football-cup', criteriaCode: 'III.2', scoreValue: 6 },
  { studentKey: 'linhchi', eventKey: 'past-festival-culture', criteriaCode: 'III.1', scoreValue: 6 },

  // === HIEU VU ===
  // maxScore III.2=6, IV.1=10, IV.2=10, V.1=6
  // Hiện có: III.2=6(max), IV.1=10(max), IV.2=10(max), V.1=6(max)
  // => Rất tích cực: thể thao, tình nguyện, cán bộ. Thiếu I, II, III.1, III.3, III.4, IV.3, V.2
  { studentKey: 'hieuvu', eventKey: 'past-football-cup', criteriaCode: 'III.2', scoreValue: 6 },
  { studentKey: 'hieuvu', eventKey: 'past-traffic-safety', criteriaCode: 'IV.1', scoreValue: 10 },
  { studentKey: 'hieuvu', eventKey: 'past-blood-donation', criteriaCode: 'IV.2', scoreValue: 10 },
  { studentKey: 'hieuvu', eventKey: 'past-leadership-training', criteriaCode: 'V.1', scoreValue: 6 },

  // === THANH TAM ===
  // maxScore IV.2=10, V.1=6
  // Hiện có: IV.2=10(max), V.1=6(max)
  // => Tích cực tình nguyện và cán bộ. Thiếu nhiều ở I, II, III, IV.1, IV.3, V.2
  { studentKey: 'thanhtam', eventKey: 'past-green-campus', criteriaCode: 'IV.2', scoreValue: 10 },
  { studentKey: 'thanhtam', eventKey: 'past-leadership-training', criteriaCode: 'V.1', scoreValue: 6 },
];

// ============================================================
// SUBSCRIPTIONS - Diverse preferences for recommendation
// ============================================================

type SubscriptionDef = {
  studentKey: StudentKey;
  categoryKeys: CategoryKey[];
  criteriaCodes: string[];
};

const SUBSCRIPTIONS: SubscriptionDef[] = [
  {
    studentKey: 'phantrang',
    categoryKeys: ['volunteer', 'culture'],
    criteriaCodes: ['III.1', 'IV.2'],
  },
  {
    studentKey: 'trongtin',
    categoryKeys: ['volunteer', 'leadership'],
    criteriaCodes: ['IV.1', 'V.1'],
  },
  {
    studentKey: 'minhvu',
    categoryKeys: ['academic'],
    criteriaCodes: ['I.2', 'I.3', 'I.4'],
  },
  {
    studentKey: 'linhchi',
    categoryKeys: ['culture', 'sport'],
    criteriaCodes: ['III.1', 'III.2'],
  },
  {
    studentKey: 'hieuvu',
    categoryKeys: ['sport', 'leadership'],
    criteriaCodes: ['III.2', 'V.1', 'V.2'],
  },
  {
    studentKey: 'thanhtam',
    categoryKeys: ['volunteer'],
    criteriaCodes: ['IV.2', 'IV.3'],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// ============================================================
// CLEANUP - Remove existing demo data
// ============================================================

async function cleanupDemoData() {
  console.log('[SEED-DEMO] Starting cleanup of existing demo data...');

  const userRepo = AppDataSource.getRepository(User);
  const studentRepo = AppDataSource.getRepository(Student);
  const eventRepo = AppDataSource.getRepository(Event);
  const categoryRepo = AppDataSource.getRepository(EventCategory);
  const organizerRepo = AppDataSource.getRepository(Organizer);

  // Find demo users by email prefix
  const demoUsers = await userRepo.find({
    where: { email: Like(`${DEMO_EMAIL_PREFIX}%`) },
  });
  const demoUserIds = demoUsers.map((u) => u.userId);

  // Find demo students
  const demoStudents = demoUserIds.length
    ? await studentRepo.find({ where: demoUserIds.map((uid) => ({ userId: uid })) })
    : [];
  const demoStudentIds = demoStudents.map((s) => s.studentId);

  // Clean related data
  if (demoStudentIds.length > 0) {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const scoreRepo = AppDataSource.getRepository(StudentScore);
    const registrationRepo = AppDataSource.getRepository(EventRegistration);

    const subs = await subscriptionRepo.find({
      where: demoStudentIds.map((sid) => ({ studentId: sid })),
    });
    if (subs.length) await subscriptionRepo.remove(subs);

    const scores = await scoreRepo.find({
      where: demoStudentIds.map((sid) => ({ studentId: sid })),
    });
    if (scores.length) await scoreRepo.remove(scores);

    const regs = await registrationRepo.find({
      where: demoStudentIds.map((sid) => ({ studentId: sid })),
    });
    if (regs.length) await registrationRepo.remove(regs);
  }

  if (demoStudents.length) await studentRepo.remove(demoStudents);

  // Clean demo events
  const demoEvents = await eventRepo.find({
    where: { eventSlug: Like(`${DEMO_EVENT_SLUG_PREFIX}%`) },
  });
  if (demoEvents.length) await eventRepo.remove(demoEvents);

  // Clean demo categories
  const demoCategories = await categoryRepo.find({
    where: { slug: Like(`${DEMO_CATEGORY_SLUG_PREFIX}%`) },
  });
  if (demoCategories.length) await categoryRepo.remove(demoCategories);

  // Clean demo organizers - those created by this seed (associated with demo user email)
  const demoOrgUser = await userRepo.findOne({ where: { email: 'khoacntt@ctu.edu.vn' } });
  if (demoOrgUser) {
    const demoOrganizers = await organizerRepo.find({ where: { userId: demoOrgUser.userId } });
    if (demoOrganizers.length) await organizerRepo.remove(demoOrganizers);
  }

  if (demoUsers.length) await userRepo.remove(demoUsers);

  console.log(`[SEED-DEMO] Cleanup done. Removed: ${demoUsers.length} users, ${demoStudents.length} students`);
}

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function ensureAcademicYearAndSemester(): Promise<{ yearId: string; semesterId: string }> {
  const yearRepo = AppDataSource.getRepository(AcademicYear);
  const semesterRepo = AppDataSource.getRepository(Semester);

  // Verify academic year exists with the provided ID
  const year = await yearRepo.findOne({ where: { yearId: EXISTING_ACADEMIC_YEAR_ID } as any });
  if (!year) {
    throw new Error(
      `[SEED-DEMO] Academic year 2025-2026 with ID ${EXISTING_ACADEMIC_YEAR_ID} NOT FOUND in database. ` +
      `Please create it first or check the ID.`,
    );
  }
  year.isCurrent = true;
  await yearRepo.save(year);
  console.log(`[SEED-DEMO] Found academic year: "${year.yearName}" (${year.startDate?.toISOString().split('T')[0]} - ${year.endDate?.toISOString().split('T')[0]})`);

  // Verify semester exists with the provided ID
  const semester = await semesterRepo.findOne({ where: { semesterId: EXISTING_SEMESTER_ID } as any });
  if (!semester) {
    throw new Error(
      `[SEED-DEMO] Semester I 2025-2026 with ID ${EXISTING_SEMESTER_ID} NOT FOUND in database. ` +
      `Please create it first or check the ID.`,
    );
  }
  semester.isCurrent = false;
  await semesterRepo.save(semester);
  console.log(`[SEED-DEMO] Found semester: "${semester.semesterName}" (${semester.startDate?.toISOString().split('T')[0]} - ${semester.endDate?.toISOString().split('T')[0]})`);

  return { yearId: year.yearId as string, semesterId: semester.semesterId as string };
}

async function ensureMajorAndClass(): Promise<{ majorId: string; classId: string }> {
  const falcultyRepo = AppDataSource.getRepository(Falculty);
  const majorRepo = AppDataSource.getRepository(Major);
  const classRepo = AppDataSource.getRepository(Class);

  // Find existing falculty (should exist from main seed)
  let falculty = await falcultyRepo.findOne({ where: { falcultyName: Like('%Cong nghe%') } });
  if (!falculty) {
    falculty = await falcultyRepo.findOne({ where: {} }); // any falculty
  }
  if (!falculty) {
    // Create one if none exists
    falculty = falcultyRepo.create({
      falcultyName: 'Khoa Công nghệ Thông tin',
      description: 'Khoa Công nghệ Thông tin, Đại học Cần Thơ',
    });
    falculty = await falcultyRepo.save(falculty);
    console.log('[SEED-DEMO] Created falculty: Khoa Công nghệ Thông tin');
  }

  let major = await majorRepo.findOne({ where: { majorName: Like('%Cong nghe Thong tin%') } });
  if (!major) {
    major = majorRepo.create({
      majorName: 'Công nghệ Thông tin',
      description: 'Ngành Công nghệ Thông tin',
      falcultyId: falculty.falcultyId as string,
    });
    major = await majorRepo.save(major);
    console.log('[SEED-DEMO] Created major: Công nghệ Thông tin');
  } else {
    console.log('[SEED-DEMO] Major already exists: Công nghệ Thông tin');
  }

  let cls = await classRepo.findOne({ where: { className: 'DH25CT01' } as any });
  if (!cls) {
      cls = classRepo.create({
        className: 'DH25CT01',
        description: 'Lớp Công nghệ Thông tin - Khóa 2025',
        majorId: major.majorId as string,
        academicYear: 2025,
      });
      cls = await classRepo.save(cls);
      console.log('[SEED-DEMO] Created class: DH25CT01');
  } else {
    console.log('[SEED-DEMO] Class already exists: DH25CT01');
  }

  return { majorId: major.majorId as string, classId: cls.classId as string };
}

async function ensureStudentRole(): Promise<Role> {
  const roleRepo = AppDataSource.getRepository(Role);
  let role = await roleRepo.findOne({ where: { roleName: BASIC_ROLE.student } });

  if (!role) {
    role = roleRepo.create({
      roleName: BASIC_ROLE.student,
      description: 'Student role for demo',
      isActive: true,
      isDeleted: false,
    });
    role = await roleRepo.save(role);
    console.log('[SEED-DEMO] Created role: STUDENT');
  }

  return role;
}

async function ensureOrganizer(): Promise<string> {
  const organizerRepo = AppDataSource.getRepository(Organizer);
  const userRepo = AppDataSource.getRepository(User);

  // Reuse existing organizer if already exists in DB
  let existing = await organizerRepo.findOne({ where: { organizerName: Like('%Khoa CNTT%') } });
  if (existing) {
    console.log('[SEED-DEMO] Reusing existing organizer: "Khoa CNTT & TT CTU"');
    return existing.organizerId;
  }

  // Find existing user that can be organizer
  let orgUser = await userRepo.findOne({ where: { email: 'khoacntt@ctu.edu.vn' } });
  if (!orgUser) {
    const password = await hashPassword('123456');
    const roleRepo = AppDataSource.getRepository(Role);
    const studentRole = await roleRepo.findOne({ where: { roleName: BASIC_ROLE.student } });
    const newOrgUser = userRepo.create();
    newOrgUser.email = 'khoacntt@ctu.edu.vn';
    newOrgUser.fullName = 'Khoa Công nghệ Thông tin và Truyền thông';
    newOrgUser.password = password;
    newOrgUser.phoneNumber = '02923834567';
    newOrgUser.age = 30;
    newOrgUser.gender = UserGender.other;
    newOrgUser.roleId = studentRole?.roleId ?? '';
    newOrgUser.isDeleted = false;
    orgUser = await userRepo.save(newOrgUser);
    console.log('[SEED-DEMO] Created organizer user: khoacntt@ctu.edu.vn');
  }

  const organizer = organizerRepo.create({
    organizerName: 'Khoa Công nghệ Thông tin và Truyền thông - ĐHCT',
    description: 'Khoa Công nghệ Thông tin và Truyền thông, Đại học Cần Thơ - Đơn vị tổ chức sự kiện rèn luyện',
    userId: orgUser.userId,
  });
  const saved = await organizerRepo.save(organizer);
  console.log('[SEED-DEMO] Created organizer: Khoa CNTT & TT CTU');
  return saved.organizerId;
}

async function seedCategories(): Promise<Record<CategoryKey, EventCategory>> {
  const categoryRepo = AppDataSource.getRepository(EventCategory);
  const result: Record<CategoryKey, EventCategory> = {} as any;

  for (const cat of DEMO_CATEGORIES) {
    let entity = await categoryRepo.findOne({ where: { slug: cat.slug } });
    if (!entity) {
      entity = categoryRepo.create({
        categoryName: cat.categoryName,
        slug: cat.slug,
        description: cat.description,
      });
      entity = await categoryRepo.save(entity);
    }
    result[cat.key] = entity;
  }

  console.log(`[SEED-DEMO] Seeded ${DEMO_CATEGORIES.length} categories`);
  return result;
}

async function seedStudents(role: Role, classId: string): Promise<Record<StudentKey, Student>> {
  const userRepo = AppDataSource.getRepository(User);
  const studentRepo = AppDataSource.getRepository(Student);
  const password = await hashPassword('123456');

  const result: Record<StudentKey, Student> = {} as any;

  for (const studentDef of DEMO_STUDENTS) {
    // Check if user already exists
    let user = await userRepo.findOne({ where: { email: studentDef.email } });
    if (!user) {
      user = userRepo.create({
        email: studentDef.email,
        fullName: studentDef.fullName,
        password,
        phoneNumber: `090000${studentDef.key === 'phantrang' ? '01' : studentDef.key === 'trongtin' ? '02' : studentDef.key === 'minhvu' ? '03' : studentDef.key === 'linhchi' ? '04' : studentDef.key === 'hieuvu' ? '05' : '06'}`,
        age: studentDef.age,
        gender: studentDef.gender,
        birthDate: new Date(2004 + (DEMO_STUDENTS.indexOf(studentDef) % 3), 1 + DEMO_STUDENTS.indexOf(studentDef), 15),
        roleId: role.roleId,
        isDeleted: false,
      });
      user = await userRepo.save(user);
    }

    let student = await studentRepo.findOne({ where: { userId: user.userId } });
    if (!student) {
      student = studentRepo.create({
        studentCode: studentDef.studentCode,
        userId: user.userId,
        classId,
        enrollmentYear: 2023,
      });
      student = await studentRepo.save(student);
    }

    result[studentDef.key] = student;
  }

  console.log(`[SEED-DEMO] Seeded ${DEMO_STUDENTS.length} demo students`);
  return result;
}

async function seedEvents(
  categories: Record<CategoryKey, EventCategory>,
  organizerId: string,
  semesterId: string,
): Promise<Record<string, Event>> {
  const eventRepo = AppDataSource.getRepository(Event);
  const result: Record<string, Event> = {};

  const allEvents = [...PAST_EVENTS, ...FUTURE_EVENTS];

  for (const evtDef of allEvents) {
    const criteriaInfo = CRITERIA_CODES[evtDef.criteriaCode];
    if (!criteriaInfo) {
      console.warn(`[SEED-DEMO] Criteria ${evtDef.criteriaCode} not found, skipping event ${evtDef.key}`);
      continue;
    }

    let event = await eventRepo.findOne({ where: { eventSlug: evtDef.slug } });
    if (!event) {
      event = eventRepo.create({
        eventName: evtDef.eventName,
        description: `${evtDef.eventName}. Được tổ chức bởi Khoa Công nghệ Thông tin và Truyền thông, Đại học Cần Thơ.`,
        location: evtDef.location,
        startDate: evtDef.startDate,
        endDate: evtDef.endDate,
        registrationDeadline: evtDef.registrationDeadline,
        maxParticipants: evtDef.maxParticipants,
        eventSlug: evtDef.slug,
        status: EVENT_STATUS.APPROVED,
        criteriaId: criteriaInfo.criteriaId,
        score: evtDef.score,
        requiresApproval: false,
        categories: evtDef.categoryKeys.map((k) => categories[k]),
        organizerId,
        createdBy: null,
        approvedBy: null,
        approvedAt: new Date(),
        semesterId,
      });
      event = await eventRepo.save(event);
    }

    result[evtDef.key] = event;
  }

  console.log(`[SEED-DEMO] Seeded ${allEvents.length} events (${PAST_EVENTS.length} past + ${FUTURE_EVENTS.length} future)`);
  return result;
}

async function seedRegistrations(
  students: Record<StudentKey, Student>,
  events: Record<string, Event>,
): Promise<void> {
  const registrationRepo = AppDataSource.getRepository(EventRegistration);

  let count = 0;
  for (const regDef of REGISTRATIONS) {
    const student = students[regDef.studentKey];
    const event = events[regDef.eventKey];
    if (!student || !event) continue;

    let existing = await registrationRepo.findOne({
      where: { studentId: student.studentId, eventId: event.eventId },
    });

    if (!existing) {
      existing = registrationRepo.create({
        studentId: student.studentId,
        eventId: event.eventId,
        status: regDef.status,
        attendedAt: regDef.attendedAt ?? null,
        cancelledAt: regDef.cancelledAt ?? null,
      });
      await registrationRepo.save(existing);
      count++;
    }
  }

  console.log(`[SEED-DEMO] Seeded ${count} registrations`);
}

async function seedScores(
  students: Record<StudentKey, Student>,
  events: Record<string, Event>,
  semesterId: string,
): Promise<void> {
  const scoreRepo = AppDataSource.getRepository(StudentScore);

  let count = 0;
  for (const scoreDef of SCORE_ROWS) {
    const student = students[scoreDef.studentKey];
    const event = events[scoreDef.eventKey];
    if (!student || !event) continue;

    const criteriaInfo = CRITERIA_CODES[scoreDef.criteriaCode];
    if (!criteriaInfo) continue;

    // Check if score already exists
    const existing = await scoreRepo.findOne({
      where: { studentId: student.studentId, eventId: event.eventId },
    });

    if (!existing) {
      const score = scoreRepo.create({
        studentId: student.studentId,
        eventId: event.eventId,
        criteriaId: criteriaInfo.criteriaId,
        scoreValue: scoreDef.scoreValue,
        semesterId,
      });
      await scoreRepo.save(score);
      count++;
    }
  }

  console.log(`[SEED-DEMO] Seeded ${count} student scores`);
}

async function seedSubscriptions(
  students: Record<StudentKey, Student>,
  categories: Record<CategoryKey, EventCategory>,
): Promise<void> {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);

  let count = 0;
  for (const subDef of SUBSCRIPTIONS) {
    const student = students[subDef.studentKey];
    if (!student) continue;

    let existing = await subscriptionRepo.findOne({
      where: { studentId: student.studentId },
      relations: ['categories', 'criteria'],
    });

    if (!existing) {
      const catEntities = subDef.categoryKeys.map((k) => categories[k]).filter(Boolean);
      const critEntities = subDef.criteriaCodes
        .map((code) => CRITERIA_CODES[code])
        .filter(Boolean)
        .map((info) => ({ criteriaId: info.criteriaId } as Criteria));

      existing = subscriptionRepo.create({
        studentId: student.studentId,
        categories: catEntities,
        criteria: critEntities,
      });
      await subscriptionRepo.save(existing);
      count++;
    }
  }

  console.log(`[SEED-DEMO] Seeded ${count} subscriptions`);
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

export async function seedRecommendationDemo() {
  console.log('==================================================');
  console.log(' CTU INFINITY - SEED DEMO DATA');
  console.log(' Demo Date: 21/04/2026 (07:00 - 15:00 VN)');
  console.log('==================================================');
  console.log('');

  try {
    // Step 1: Cleanup
    await cleanupDemoData();

    // Step 2: Academic year & semester
    const { yearId, semesterId } = await ensureAcademicYearAndSemester();
    void yearId;

    // Step 3: Major & class
    const { majorId, classId } = await ensureMajorAndClass();
    void majorId;

    // Step 4: Role
    const role = await ensureStudentRole();

    // Step 5: Organizer
    const organizerId = await ensureOrganizer();

    // Step 6: Categories
    const categories = await seedCategories();

    // Step 7: Students
    const students = await seedStudents(role, classId);

    // Step 8: Events
    const events = await seedEvents(categories, organizerId, semesterId);

    // Step 9: Registrations
    await seedRegistrations(students, events);

    // Step 10: Scores
    await seedScores(students, events, semesterId);

    // Step 11: Subscriptions
    await seedSubscriptions(students, categories);

    console.log('');
    console.log('==================================================');
    console.log(' SEED DEMO DATA SUCCESSFUL!');
    console.log('==================================================');
    console.log('');
    console.log('Tài khoản demo (password: 123456):');
    console.log('------------------------------------------------');
    for (const s of DEMO_STUDENTS) {
      console.log(`  ${s.fullName.padEnd(20)} | ${s.email.padEnd(35)} | ${s.studentCode}`);
    }
    console.log('------------------------------------------------');
    console.log('');
    console.log('Using existing Academic Year 2025-2026 (ID: 0f2bcc04-b169-45bf-ac3e-f5d2a8be218a)');
    console.log('Using existing Semester I (ID: 6d155101-0c01-40b0-8d97-5cd84499a9cf) | 08/09/2025 - 21/12/2025');
    console.log('');
    console.log(`Past Events: ${PAST_EVENTS.length} events (within HK I 2025-2026)`);
    console.log(`Future Events: ${FUTURE_EVENTS.length} events (open for registration)`);
    console.log(`Students: ${DEMO_STUDENTS.length} students with strategic score deficits`);
    console.log('');
    console.log('==================================================');
  } catch (error) {
    console.error('[SEED-DEMO] ERROR during seeding:', error);
    throw error;
  }
}

// ============================================================
// RUN SEED
// ============================================================

async function runSeed() {
  await AppDataSource.initialize();
  try {
    await seedRecommendationDemo();
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed().catch((error) => {
  console.error('[SEED-DEMO] Seed failed:', error);
  process.exit(1);
});
