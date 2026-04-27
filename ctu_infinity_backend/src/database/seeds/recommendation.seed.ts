import * as bcrypt from 'bcryptjs';
import { In, Like } from 'typeorm';
import { AppDataSource } from '../data-source';
import { BASIC_ROLE } from 'src/constant/role.constant';
import { Role } from 'src/modules/roles/entities/role.entity';
import { User, UserGender } from 'src/modules/users/entities/user.entity';
import { Student } from 'src/modules/students/entities/student.entity';
import { EventCategory } from 'src/modules/event_category/entities/event_category.entity';
import { CriteriaFrame } from 'src/modules/criteria-frame/entities/criteria-frame.entity';
import { Criteria } from 'src/modules/criterias/entities/criteria.entity';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';
import { Event, EVENT_STATUS } from 'src/modules/events/entities/event.entity';
import {
  EventRegistration,
  REGISTRATION_STATUS,
} from 'src/modules/event-registration/entities/event-registration.entity';
import { StudentScore } from 'src/modules/student-score/entities/student-score.entity';
import { Subscription } from 'src/modules/subscriptions/entities/subscription.entity';

const DEMO_EMAIL_PREFIX = 'demo.student';
const LEGACY_DEMO_EMAIL_PREFIX = 'rec.demo.student';
const DEMO_STUDENT_CODE_PREFIX = 'CTUDEMO';
const DEMO_EVENT_SLUG_PREFIX = 'drl-demo-';
const LEGACY_EVENT_SLUG_PREFIX = 'rec-demo-';
const DEMO_CATEGORY_SLUG_PREFIX = 'drl-demo-';
const LEGACY_CATEGORY_SLUG_PREFIX = 'rec-demo-';
const DEMO_FRAMEWORK_NAME = 'Khung tieu chi danh gia ren luyen CTU 2025-2026';
const DEMO_FRAMEWORK_VERSION = '2025-2026';

type DemoStudentKey = 'student1' | 'student2' | 'student3' | 'student4' | 'student5' | 'student6';
type DemoCategoryKey = 'academic' | 'volunteer' | 'culture' | 'sport' | 'leadership';
type DemoCriteriaKey = string;

type DemoEventDefinition = {
  key: string;
  eventName: string;
  slug: string;
  criteriaKey: DemoCriteriaKey;
  categoryKeys: DemoCategoryKey[];
  score: number;
  startDate: Date;
  registrationDeadline: Date;
  durationHours?: number;
};

const DEMO_STUDENTS: Array<{
  key: DemoStudentKey;
  index: number;
  email: string;
  fullName: string;
  studentCode: string;
}> = [
  {
    key: 'student1',
    index: 1,
    email: 'demo.student1@ctu.local',
    fullName: 'Nguyen Minh An',
    studentCode: 'CTUDEMO001',
  },
  {
    key: 'student2',
    index: 2,
    email: 'demo.student2@ctu.local',
    fullName: 'Tran Ngoc Bao',
    studentCode: 'CTUDEMO002',
  },
  {
    key: 'student3',
    index: 3,
    email: 'demo.student3@ctu.local',
    fullName: 'Le Thu Cuc',
    studentCode: 'CTUDEMO003',
  },
  {
    key: 'student4',
    index: 4,
    email: 'demo.student4@ctu.local',
    fullName: 'Pham Gia Dat',
    studentCode: 'CTUDEMO004',
  },
  {
    key: 'student5',
    index: 5,
    email: 'demo.student5@ctu.local',
    fullName: 'Hoang Thi Yen',
    studentCode: 'CTUDEMO005',
  },
  {
    key: 'student6',
    index: 6,
    email: 'demo.student6@ctu.local',
    fullName: 'Vo Quoc Huy',
    studentCode: 'CTUDEMO006',
  },
];

const DEMO_CATEGORIES: Array<{
  key: DemoCategoryKey;
  categoryName: string;
  slug: string;
  description: string;
}> = [
  {
    key: 'academic',
    categoryName: 'Hoc thuat',
    slug: 'drl-demo-hoc-thuat',
    description: 'Danh muc hoat dong hoc thuat va nghien cuu',
  },
  {
    key: 'volunteer',
    categoryName: 'Tinh nguyen - cong dong',
    slug: 'drl-demo-tinh-nguyen',
    description: 'Danh muc hoat dong tinh nguyen va cong dong',
  },
  {
    key: 'culture',
    categoryName: 'Van hoa - van nghe',
    slug: 'drl-demo-van-hoa',
    description: 'Danh muc hoat dong van hoa, van nghe',
  },
  {
    key: 'sport',
    categoryName: 'The thao',
    slug: 'drl-demo-the-thao',
    description: 'Danh muc hoat dong the thao va suc khoe',
  },
  {
    key: 'leadership',
    categoryName: 'Ky nang - lanh dao',
    slug: 'drl-demo-lanh-dao',
    description: 'Danh muc hoat dong ky nang, lanh dao va can bo lop',
  },
];

type DemoCriteriaDefinition = {
  key: DemoCriteriaKey;
  criteriaCode: string;
  criteriaName: string;
  maxScore: number | null;
  displayOrder: number;
  parentKey?: DemoCriteriaKey | null;
  description: string;
};

const DEMO_CRITERIA_ROOTS: DemoCriteriaDefinition[] = [
  {
    key: 'I',
    criteriaCode: 'I',
    criteriaName: 'Danh gia ve y thuc tham gia hoc tap',
    maxScore: 20,
    displayOrder: 1,
    parentKey: null,
    description: 'Dieu 4, Quy che Danh gia ket qua ren luyen',
  },
  {
    key: 'II',
    criteriaCode: 'II',
    criteriaName: 'Danh gia ve y thuc chap hanh noi quy, quy che trong nha truong',
    maxScore: 25,
    displayOrder: 2,
    parentKey: null,
    description: 'Dieu 5, Quy che Danh gia ket qua ren luyen',
  },
  {
    key: 'III',
    criteriaCode: 'III',
    criteriaName: 'Danh gia ve tham gia hoat dong chinh tri, xa hoi, van hoa, the thao',
    maxScore: 25,
    displayOrder: 3,
    parentKey: null,
    description: 'Dieu 6, Quy che Danh gia ket qua ren luyen',
  },
  {
    key: 'IV',
    criteriaCode: 'IV',
    criteriaName: 'Danh gia ve y thuc cong dan trong cong dong',
    maxScore: 25,
    displayOrder: 4,
    parentKey: null,
    description: 'Dieu 7, Quy che Danh gia ket qua ren luyen',
  },
  {
    key: 'V',
    criteriaCode: 'V',
    criteriaName: 'Danh gia ve can bo lop, doan the va thanh tich dac biet',
    maxScore: 10,
    displayOrder: 5,
    parentKey: null,
    description: 'Dieu 8, Quy che Danh gia ket qua ren luyen',
  },
];

const DEMO_CRITERIA_CHILDREN: DemoCriteriaDefinition[] = [
  {
    key: 'I.1',
    criteriaCode: 'I.1',
    criteriaName: 'Chuyen can va thuc hien noi quy lop hoc',
    maxScore: 5,
    displayOrder: 1,
    parentKey: 'I',
    description: 'Tham gia hoc tap day du, thuc hien noi quy lop hoc',
  },
  {
    key: 'I.2',
    criteriaCode: 'I.2',
    criteriaName: 'Tham gia nghien cuu khoa hoc va hoat dong hoc thuat',
    maxScore: 6,
    displayOrder: 2,
    parentKey: 'I',
    description: 'Hoi thao, nghien cuu, cuoc thi hoc thuat',
  },
  {
    key: 'I.3',
    criteriaCode: 'I.3',
    criteriaName: 'Ky nang tu hoc va ho tro hoc tap',
    maxScore: 5,
    displayOrder: 3,
    parentKey: 'I',
    description: 'Ky nang tu hoc, ho tro hoc tap, chia se kinh nghiem',
  },
  {
    key: 'I.4',
    criteriaCode: 'I.4',
    criteriaName: 'Thanh tich hoc tap va cuoc thi hoc thuat',
    maxScore: 4,
    displayOrder: 4,
    parentKey: 'I',
    description: 'Dat giai cuoc thi hoc thuat va sang tao',
  },
  {
    key: 'II.1',
    criteriaCode: 'II.1',
    criteriaName: 'Chap hanh noi quy, quy che cua nha truong',
    maxScore: 8,
    displayOrder: 1,
    parentKey: 'II',
    description: 'Thuc hien nghiem tuc noi quy, quy che',
  },
  {
    key: 'II.2',
    criteriaCode: 'II.2',
    criteriaName: 'Tham gia sinh hoat cong dan, tuyen truyen noi quy',
    maxScore: 7,
    displayOrder: 2,
    parentKey: 'II',
    description: 'Sinh hoat cong dan, tuyen truyen van minh hoc duong',
  },
  {
    key: 'II.3',
    criteriaCode: 'II.3',
    criteriaName: 'Y thuc chap hanh cac quy dinh hanh chinh',
    maxScore: 5,
    displayOrder: 3,
    parentKey: 'II',
    description: 'Thuc hien nghia vu, thu tuc hanh chinh dung han',
  },
  {
    key: 'II.4',
    criteriaCode: 'II.4',
    criteriaName: 'Ky luat va van minh hoc duong',
    maxScore: 5,
    displayOrder: 4,
    parentKey: 'II',
    description: 'Giu gin nep song van minh, khong vi pham ky luat',
  },
  {
    key: 'III.1',
    criteriaCode: 'III.1',
    criteriaName: 'Tham gia van hoa - van nghe',
    maxScore: 6,
    displayOrder: 1,
    parentKey: 'III',
    description: 'Van hoa, van nghe, lien hoan va phong trao',
  },
  {
    key: 'III.2',
    criteriaCode: 'III.2',
    criteriaName: 'Tham gia hoat dong the thao',
    maxScore: 6,
    displayOrder: 2,
    parentKey: 'III',
    description: 'Giai the thao, phong trao ren luyen',
  },
  {
    key: 'III.3',
    criteriaCode: 'III.3',
    criteriaName: 'Tham gia tinh nguyen va cong tac xa hoi',
    maxScore: 6,
    displayOrder: 3,
    parentKey: 'III',
    description: 'Tinh nguyen, cong tac xa hoi, huong ve cong dong',
  },
  {
    key: 'III.4',
    criteriaCode: 'III.4',
    criteriaName: 'Tham gia phong trao Doan - Hoi',
    maxScore: 7,
    displayOrder: 4,
    parentKey: 'III',
    description: 'Tham gia phong trao, chien dich cua Doan - Hoi',
  },
  {
    key: 'IV.1',
    criteriaCode: 'IV.1',
    criteriaName: 'Chap hanh phap luat va an toan giao thong',
    maxScore: 10,
    displayOrder: 1,
    parentKey: 'IV',
    description: 'Chap hanh phap luat, an toan giao thong',
  },
  {
    key: 'IV.2',
    criteriaCode: 'IV.2',
    criteriaName: 'Hoat dong vi cong dong va bao ve moi truong',
    maxScore: 10,
    displayOrder: 2,
    parentKey: 'IV',
    description: 'Hoat dong vi cong dong, bao ve moi truong',
  },
  {
    key: 'IV.3',
    criteriaCode: 'IV.3',
    criteriaName: 'Tuyen truyen phong chong te nan xa hoi',
    maxScore: 5,
    displayOrder: 3,
    parentKey: 'IV',
    description: 'Phong chong te nan, ky nang song lanh manh',
  },
  {
    key: 'V.1',
    criteriaCode: 'V.1',
    criteriaName: 'Can bo lop, can bo Doan - Hoi',
    maxScore: 6,
    displayOrder: 1,
    parentKey: 'V',
    description: 'Tham gia cong tac can bo, lanh dao tap the',
  },
  {
    key: 'V.2',
    criteriaCode: 'V.2',
    criteriaName: 'Thanh tich dac biet trong hoc tap va ren luyen',
    maxScore: 4,
    displayOrder: 2,
    parentKey: 'V',
    description: 'Thanh tich dac biet trong hoc tap va phong trao',
  },
];

const SEED_YEAR = new Date().getFullYear();
const APRIL = 3;
const MARCH = 2;

function dateAt(year: number, monthIndex: number, day: number, hour: number, minute = 0): Date {
  return new Date(year, monthIndex, day, hour, minute, 0);
}

const PAST_EVENTS: DemoEventDefinition[] = [
  {
    key: 'past-study-methods',
    eventName: 'Workshop Phuong phap hoc tap dai hoc',
    slug: 'drl-demo-workshop-phuong-phap-hoc-tap',
    criteriaKey: 'I.1',
    categoryKeys: ['academic'],
    score: 5,
    startDate: dateAt(SEED_YEAR, MARCH, 8, 8),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 7, 23),
    durationHours: 3,
  },
  {
    key: 'past-research-forum',
    eventName: 'Chuyen de Nghien cuu khoa hoc va khoi nghiep',
    slug: 'drl-demo-chuyen-de-nghien-cuu',
    criteriaKey: 'I.2',
    categoryKeys: ['academic', 'leadership'],
    score: 6,
    startDate: dateAt(SEED_YEAR, MARCH, 12, 14),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 11, 23),
    durationHours: 3,
  },
  {
    key: 'past-citizen-week',
    eventName: 'Sinh hoat cong dan dau nam hoc',
    slug: 'drl-demo-sinh-hoat-cong-dan',
    criteriaKey: 'II.2',
    categoryKeys: ['academic'],
    score: 7,
    startDate: dateAt(SEED_YEAR, MARCH, 15, 8),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 14, 23),
    durationHours: 3,
  },
  {
    key: 'past-green-volunteer',
    eventName: 'Chuong trinh Tinh nguyen xanh - don ve sinh khuon vien',
    slug: 'drl-demo-tinh-nguyen-xanh',
    criteriaKey: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateAt(SEED_YEAR, MARCH, 18, 7),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 17, 23),
    durationHours: 4,
  },
  {
    key: 'past-cultural-festival',
    eventName: 'Lien hoan Van nghe khoa 2026',
    slug: 'drl-demo-lien-hoan-van-nghe',
    criteriaKey: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateAt(SEED_YEAR, MARCH, 22, 18),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 21, 23),
    durationHours: 3,
  },
  {
    key: 'past-football-cup',
    eventName: 'Giai bong da sinh vien khoa CNTT',
    slug: 'drl-demo-giai-bong-da',
    criteriaKey: 'III.2',
    categoryKeys: ['sport'],
    score: 6,
    startDate: dateAt(SEED_YEAR, MARCH, 24, 7),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 23, 23),
    durationHours: 3,
  },
  {
    key: 'past-leadership-training',
    eventName: 'Tap huan can bo lop va ky nang lanh dao',
    slug: 'drl-demo-tap-huan-can-bo',
    criteriaKey: 'V.1',
    categoryKeys: ['leadership'],
    score: 5,
    startDate: dateAt(SEED_YEAR, MARCH, 27, 8),
    registrationDeadline: dateAt(SEED_YEAR, MARCH, 26, 23),
    durationHours: 3,
  },
  {
    key: 'past-blood-donation',
    eventName: 'Hien mau nhan dao',
    slug: 'drl-demo-hien-mau-nhan-dao',
    criteriaKey: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateAt(SEED_YEAR, APRIL, 3, 7),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 2, 23),
    durationHours: 4,
  },
];

const FUTURE_EVENTS: DemoEventDefinition[] = [
  {
    key: 'future-ai-seminar',
    eventName: 'Hoi thao AI ung dung cho sinh vien',
    slug: 'drl-demo-hoi-thao-ai-ung-dung',
    criteriaKey: 'I.2',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 16, 8),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 15, 23),
    durationHours: 3,
  },
  {
    key: 'future-self-learning',
    eventName: 'Toa dam Ky nang tu hoc va quan ly thoi gian',
    slug: 'drl-demo-toa-dam-tu-hoc',
    criteriaKey: 'I.3',
    categoryKeys: ['academic', 'leadership'],
    score: 5,
    startDate: dateAt(SEED_YEAR, APRIL, 16, 14),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 15, 23),
    durationHours: 2,
  },
  {
    key: 'future-academic-pitch',
    eventName: 'Cuoc thi thuyet trinh hoc thuat',
    slug: 'drl-demo-cuoc-thi-thuyet-trinh',
    criteriaKey: 'I.4',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 17, 9),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 16, 23),
    durationHours: 3,
  },
  {
    key: 'future-campus-culture',
    eventName: 'Ngay hoi Van hoa ung xu CTU',
    slug: 'drl-demo-van-hoa-ung-xu',
    criteriaKey: 'II.1',
    categoryKeys: ['culture'],
    score: 7,
    startDate: dateAt(SEED_YEAR, APRIL, 18, 8),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 17, 23),
    durationHours: 3,
  },
  {
    key: 'future-traffic-safety',
    eventName: 'Sinh hoat cong dan ve an toan giao thong',
    slug: 'drl-demo-an-toan-giao-thong',
    criteriaKey: 'IV.1',
    categoryKeys: ['volunteer'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 18, 14),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 17, 23),
    durationHours: 2,
  },
  {
    key: 'future-art-night',
    eventName: 'Chuong trinh Van nghe chao mung 30/4',
    slug: 'drl-demo-van-nghe-30-4',
    criteriaKey: 'III.1',
    categoryKeys: ['culture'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 19, 18),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 18, 23),
    durationHours: 3,
  },
  {
    key: 'future-badminton-cup',
    eventName: 'Giai cau long sinh vien mo rong',
    slug: 'drl-demo-giai-cau-long',
    criteriaKey: 'III.2',
    categoryKeys: ['sport'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 19, 7),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 18, 23),
    durationHours: 4,
  },
  {
    key: 'future-community-day',
    eventName: 'Ngay hoi Tinh nguyen vi cong dong',
    slug: 'drl-demo-ngay-hoi-tinh-nguyen',
    criteriaKey: 'IV.2',
    categoryKeys: ['volunteer'],
    score: 10,
    startDate: dateAt(SEED_YEAR, APRIL, 20, 7),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 19, 23),
    durationHours: 4,
  },
  {
    key: 'future-leadership-bootcamp',
    eventName: 'Tap huan can bo Doan - Hoi',
    slug: 'drl-demo-tap-huan-doan-hoi',
    criteriaKey: 'V.1',
    categoryKeys: ['leadership'],
    score: 5,
    startDate: dateAt(SEED_YEAR, APRIL, 20, 14),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 19, 23),
    durationHours: 3,
  },
  {
    key: 'future-career-workshop',
    eventName: 'Workshop ky nang viet CV va phong van',
    slug: 'drl-demo-workshop-cv-phong-van',
    criteriaKey: 'I.3',
    categoryKeys: ['leadership', 'academic'],
    score: 5,
    startDate: dateAt(SEED_YEAR, APRIL, 21, 8),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 20, 23),
    durationHours: 3,
  },
  {
    key: 'future-campus-discipline',
    eventName: 'Chien dich van minh hoc duong',
    slug: 'drl-demo-van-minh-hoc-duong',
    criteriaKey: 'II.4',
    categoryKeys: ['academic'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 21, 14),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 20, 23),
    durationHours: 2,
  },
  {
    key: 'future-anti-social',
    eventName: 'Tuyen truyen phong chong te nan xa hoi',
    slug: 'drl-demo-phong-chong-te-nan',
    criteriaKey: 'IV.3',
    categoryKeys: ['volunteer'],
    score: 5,
    startDate: dateAt(SEED_YEAR, APRIL, 22, 8),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 21, 23),
    durationHours: 3,
  },
  {
    key: 'future-registered-excluded',
    eventName: 'Chuong trinh Chia se ky nang viec nhom',
    slug: 'drl-demo-ky-nang-viec-nhom',
    criteriaKey: 'V.2',
    categoryKeys: ['leadership'],
    score: 4,
    startDate: dateAt(SEED_YEAR, APRIL, 22, 14),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 21, 23),
    durationHours: 2,
  },
  {
    key: 'future-cancelled-excluded',
    eventName: 'Giai chay bo gay quy',
    slug: 'drl-demo-giai-chay-gay-quy',
    criteriaKey: 'III.3',
    categoryKeys: ['sport', 'volunteer'],
    score: 6,
    startDate: dateAt(SEED_YEAR, APRIL, 22, 6),
    registrationDeadline: dateAt(SEED_YEAR, APRIL, 21, 23),
    durationHours: 3,
  },
];

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function addHours(baseDate: Date, hours: number): Date {
  const nextDate = new Date(baseDate);
  nextDate.setHours(nextDate.getHours() + hours);
  return nextDate;
}

async function ensureNormalUserRole(): Promise<Role> {
  const roleRepo = AppDataSource.getRepository(Role);
  let role = await roleRepo.findOne({
    where: { roleName: BASIC_ROLE.normal_user },
  });

  if (!role) {
    role = roleRepo.create({
      roleName: BASIC_ROLE.normal_user,
      description: 'Role created for recommendation demo seeding',
      isActive: true,
      isDeleted: false,
    });
    await roleRepo.save(role);
  }

  return role;
}

async function cleanupDemoData() {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  const scoreRepo = AppDataSource.getRepository(StudentScore);
  const registrationRepo = AppDataSource.getRepository(EventRegistration);
  const eventRepo = AppDataSource.getRepository(Event);
  const criteriaRepo = AppDataSource.getRepository(Criteria);
  const frameworkRepo = AppDataSource.getRepository(CriteriaFrame);
  const studentRepo = AppDataSource.getRepository(Student);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(EventCategory);

  const demoUsers = await userRepo.find({
    where: [
      { email: Like(`${DEMO_EMAIL_PREFIX}%`) },
      { email: Like(`${LEGACY_DEMO_EMAIL_PREFIX}%`) },
    ],
  });
  const demoUserIds = demoUsers.map((user) => user.userId);

  const demoStudents = demoUserIds.length
    ? await studentRepo.find({
        where: demoUserIds.map((userId) => ({ userId })),
      })
    : [];
  const demoStudentIds = demoStudents.map((student) => student.studentId);

  if (demoStudentIds.length > 0) {
    const subscriptions = await subscriptionRepo.find({
      where: demoStudentIds.map((studentId) => ({ studentId })),
      relations: ['categories', 'criteria'],
    });
    if (subscriptions.length > 0) {
      await subscriptionRepo.remove(subscriptions);
    }

    const scores = await scoreRepo.find({
      where: demoStudentIds.map((studentId) => ({ studentId })),
    });
    if (scores.length > 0) {
      await scoreRepo.remove(scores);
    }

    const registrations = await registrationRepo.find({
      where: demoStudentIds.map((studentId) => ({ studentId })),
    });
    if (registrations.length > 0) {
      await registrationRepo.remove(registrations);
    }
  }

  const demoEvents = await eventRepo.find({
    where: [
      { eventSlug: Like(`${DEMO_EVENT_SLUG_PREFIX}%`) },
      { eventSlug: Like(`${LEGACY_EVENT_SLUG_PREFIX}%`) },
    ],
    relations: ['categories'],
  });
  if (demoEvents.length > 0) {
    await eventRepo.remove(demoEvents);
  }

  const demoFramework = await frameworkRepo.findOne({
    where: {
      frameworkName: DEMO_FRAMEWORK_NAME,
      version: DEMO_FRAMEWORK_VERSION,
    },
  });

  if (demoFramework) {
    const demoCriterias = await criteriaRepo.find({
      where: { frameworkId: demoFramework.frameworkId },
    });
    if (demoCriterias.length > 0) {
      await criteriaRepo.remove(demoCriterias);
    }
    await frameworkRepo.remove(demoFramework);
  }

  const demoCategories = await categoryRepo.find({
    where: [
      { slug: Like(`${DEMO_CATEGORY_SLUG_PREFIX}%`) },
      { slug: Like(`${LEGACY_CATEGORY_SLUG_PREFIX}%`) },
    ],
  });
  if (demoCategories.length > 0) {
    await categoryRepo.remove(demoCategories);
  }

  if (demoStudents.length > 0) {
    await studentRepo.remove(demoStudents);
  }

  if (demoUsers.length > 0) {
    await userRepo.remove(demoUsers);
  }
}

async function createDemoStudents(role: Role) {
  const userRepo = AppDataSource.getRepository(User);
  const studentRepo = AppDataSource.getRepository(Student);
  const defaultPassword = process.env.DEFAULT_PASSWORD || '123456';
  const password = await hashPassword(defaultPassword);

  const userEntities = DEMO_STUDENTS.map((demoStudent, index) =>
    userRepo.create({
      email: demoStudent.email,
      fullName: demoStudent.fullName,
      password,
      phoneNumber: `0900000${String(index + 1).padStart(3, '0')}`,
      age: 19 + index,
      gender: index % 2 === 0 ? UserGender.male : UserGender.female,
      birthDate: new Date(2004, index % 12, 10 + index),
      roleId: role.roleId,
      isDeleted: false,
    }),
  );

  const savedUsers = await userRepo.save(userEntities);
  const studentEntities = savedUsers.map((savedUser, index) =>
    studentRepo.create({
      studentCode: DEMO_STUDENTS[index].studentCode,
      userId: savedUser.userId,
      classId: undefined,
      enrollmentYear: 2023,
    } as Partial<Student>),
  );

  const savedStudents = await studentRepo.save(studentEntities);

  return DEMO_STUDENTS.reduce<Record<DemoStudentKey, Student>>(
    (accumulator, demoStudent, index) => {
      accumulator[demoStudent.key] = savedStudents[index];
      return accumulator;
    },
    {} as Record<DemoStudentKey, Student>,
  );
}

async function createDemoCategories() {
  const categoryRepo = AppDataSource.getRepository(EventCategory);
  const categories = DEMO_CATEGORIES.map((category) =>
    categoryRepo.create({
      categoryName: category.categoryName,
      slug: category.slug,
      description: category.description,
    }),
  );

  const savedCategories = await categoryRepo.save(categories);
  return DEMO_CATEGORIES.reduce<Record<DemoCategoryKey, EventCategory>>(
    (accumulator, category, index) => {
      accumulator[category.key] = savedCategories[index];
      return accumulator;
    },
    {} as Record<DemoCategoryKey, EventCategory>,
  );
}

async function createDemoFrameworkAndCriterias() {
  const frameworkRepo = AppDataSource.getRepository(CriteriaFrame);
  const criteriaRepo = AppDataSource.getRepository(Criteria);
  const framework = await frameworkRepo.save(
    frameworkRepo.create({
      frameworkName: DEMO_FRAMEWORK_NAME,
      version: DEMO_FRAMEWORK_VERSION,
      startDate: new Date(SEED_YEAR, APRIL, 1),
      endDate: null,
      status: FrameworkStatus.ACTIVE,
      isActive: true,
      description: 'Khung tieu chi danh gia ren luyen su dung cho demo goi y',
      createdBy: null,
      approvedBy: null,
      approvedAt: null,
    }),
  );

  const rootEntities = DEMO_CRITERIA_ROOTS.map((criteria) =>
    criteriaRepo.create({
      criteriaCode: criteria.criteriaCode,
      criteriaName: criteria.criteriaName,
      description: criteria.description,
      maxScore: criteria.maxScore,
      parentId: null,
      frameworkId: framework.frameworkId,
      displayOrder: criteria.displayOrder,
    }),
  );

  const savedRoots = await criteriaRepo.save(rootEntities);
  const criteriaMap = DEMO_CRITERIA_ROOTS.reduce<Record<DemoCriteriaKey, Criteria>>(
    (accumulator, criteria, index) => {
      accumulator[criteria.key] = savedRoots[index];
      return accumulator;
    },
    {} as Record<DemoCriteriaKey, Criteria>,
  );

  const childEntities = DEMO_CRITERIA_CHILDREN.map((criteria) =>
    criteriaRepo.create({
      criteriaCode: criteria.criteriaCode,
      criteriaName: criteria.criteriaName,
      description: criteria.description,
      maxScore: criteria.maxScore,
      parentId: criteria.parentKey ? criteriaMap[criteria.parentKey].criteriaId : null,
      frameworkId: framework.frameworkId,
      displayOrder: criteria.displayOrder,
    }),
  );

  const savedChildren = await criteriaRepo.save(childEntities);
  DEMO_CRITERIA_CHILDREN.forEach((criteria, index) => {
    criteriaMap[criteria.key] = savedChildren[index];
  });

  return criteriaMap;
}

async function createDemoEvents(
  categoriesByKey: Record<DemoCategoryKey, EventCategory>,
  criteriasByKey: Record<DemoCriteriaKey, Criteria>,
) {
  const eventRepo = AppDataSource.getRepository(Event);
  const eventDefinitions = [...PAST_EVENTS, ...FUTURE_EVENTS];

  const events = eventDefinitions.map((definition) => {
    const startDate = definition.startDate;
    const registrationDeadline = definition.registrationDeadline;
    const endDate = addHours(startDate, definition.durationHours || 2);

    return eventRepo.create({
      eventName: definition.eventName,
      description: `${definition.eventName} - su kien demo he thong goi y`,
      location: 'Khu 2 - Đại học Cần Thơ',
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants: 50,
      eventSlug: definition.slug,
      posterUrl: undefined,
      status: EVENT_STATUS.APPROVED,
      criteriaId: criteriasByKey[definition.criteriaKey].criteriaId,
      score: definition.score,
      requiresApproval: false,
      categories: definition.categoryKeys.map((categoryKey) => categoriesByKey[categoryKey]),
      organizerId: undefined,
      createdBy: undefined,
      approvedBy: undefined,
      approvedAt: new Date(),
      semesterId: undefined,
    } as Partial<Event>);
  });

  const savedEvents = await eventRepo.save(events);
  return eventDefinitions.reduce<Record<string, Event>>(
    (accumulator, definition, index) => {
      accumulator[definition.key] = savedEvents[index];
      return accumulator;
    },
    {} as Record<string, Event>,
  );
}

async function createDemoRegistrations(
  studentsByKey: Record<DemoStudentKey, Student>,
  eventsByKey: Record<string, Event>,
) {
  const registrationRepo = AppDataSource.getRepository(EventRegistration);

  const resolveAttendedAt = (eventKey: string) =>
    eventsByKey[eventKey] ? addHours(eventsByKey[eventKey].startDate, 1) : null;
  const resolveCancelledAt = (eventKey: string) =>
    eventsByKey[eventKey]
      ? addHours(eventsByKey[eventKey].registrationDeadline ?? eventsByKey[eventKey].startDate, -4)
      : null;

  const definitions: Array<{
    studentKey: DemoStudentKey;
    eventKey: string;
    status: REGISTRATION_STATUS;
    attendedAt?: Date | null;
    cancelledAt?: Date | null;
  }> = [
    {
      studentKey: 'student1',
      eventKey: 'past-study-methods',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-study-methods'),
    },
    {
      studentKey: 'student1',
      eventKey: 'past-research-forum',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-research-forum'),
    },
    {
      studentKey: 'student1',
      eventKey: 'past-green-volunteer',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-green-volunteer'),
    },
    {
      studentKey: 'student1',
      eventKey: 'past-cultural-festival',
      status: REGISTRATION_STATUS.ABSENT,
    },
    {
      studentKey: 'student1',
      eventKey: 'future-registered-excluded',
      status: REGISTRATION_STATUS.REGISTERED,
    },
    {
      studentKey: 'student1',
      eventKey: 'future-cancelled-excluded',
      status: REGISTRATION_STATUS.CANCELLED,
      cancelledAt: resolveCancelledAt('future-cancelled-excluded'),
    },

    {
      studentKey: 'student2',
      eventKey: 'past-study-methods',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-study-methods'),
    },
    {
      studentKey: 'student2',
      eventKey: 'past-citizen-week',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-citizen-week'),
    },
    {
      studentKey: 'student2',
      eventKey: 'past-green-volunteer',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-green-volunteer'),
    },
    {
      studentKey: 'student2',
      eventKey: 'future-community-day',
      status: REGISTRATION_STATUS.REGISTERED,
    },
    {
      studentKey: 'student2',
      eventKey: 'future-art-night',
      status: REGISTRATION_STATUS.REGISTERED,
    },

    {
      studentKey: 'student3',
      eventKey: 'past-cultural-festival',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-cultural-festival'),
    },
    {
      studentKey: 'student3',
      eventKey: 'past-football-cup',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-football-cup'),
    },
    {
      studentKey: 'student3',
      eventKey: 'past-blood-donation',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-blood-donation'),
    },
    {
      studentKey: 'student3',
      eventKey: 'future-badminton-cup',
      status: REGISTRATION_STATUS.REGISTERED,
    },
    {
      studentKey: 'student3',
      eventKey: 'future-campus-culture',
      status: REGISTRATION_STATUS.REGISTERED,
    },

    {
      studentKey: 'student4',
      eventKey: 'past-leadership-training',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-leadership-training'),
    },
    {
      studentKey: 'student4',
      eventKey: 'past-research-forum',
      status: REGISTRATION_STATUS.ABSENT,
    },
    {
      studentKey: 'student4',
      eventKey: 'future-leadership-bootcamp',
      status: REGISTRATION_STATUS.REGISTERED,
    },
    {
      studentKey: 'student4',
      eventKey: 'future-campus-discipline',
      status: REGISTRATION_STATUS.REGISTERED,
    },

    {
      studentKey: 'student5',
      eventKey: 'past-blood-donation',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-blood-donation'),
    },
    {
      studentKey: 'student5',
      eventKey: 'past-green-volunteer',
      status: REGISTRATION_STATUS.ABSENT,
    },
    {
      studentKey: 'student5',
      eventKey: 'future-community-day',
      status: REGISTRATION_STATUS.REGISTERED,
    },

    {
      studentKey: 'student6',
      eventKey: 'past-study-methods',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-study-methods'),
    },
    {
      studentKey: 'student6',
      eventKey: 'past-citizen-week',
      status: REGISTRATION_STATUS.ATTENDED,
      attendedAt: resolveAttendedAt('past-citizen-week'),
    },
    {
      studentKey: 'student6',
      eventKey: 'future-ai-seminar',
      status: REGISTRATION_STATUS.REGISTERED,
    },
    {
      studentKey: 'student6',
      eventKey: 'future-traffic-safety',
      status: REGISTRATION_STATUS.REGISTERED,
    },
  ];

  const registrations = definitions.map((definition) =>
    registrationRepo.create({
      studentId: studentsByKey[definition.studentKey].studentId,
      eventId: eventsByKey[definition.eventKey].eventId,
      status: definition.status,
      attendedAt: definition.attendedAt ?? null,
      cancelledAt: definition.cancelledAt ?? null,
    }),
  );

  await registrationRepo.save(registrations);
}

async function createDemoScores(
  studentsByKey: Record<DemoStudentKey, Student>,
  eventsByKey: Record<string, Event>,
  criteriasByKey: Record<DemoCriteriaKey, Criteria>,
) {
  const scoreRepo = AppDataSource.getRepository(StudentScore);

  const scoreRows = [
    {
      studentId: studentsByKey.student1.studentId,
      eventId: eventsByKey['past-study-methods'].eventId,
      criteriaId: criteriasByKey['I.1'].criteriaId,
      scoreValue: 5,
    },
    {
      studentId: studentsByKey.student1.studentId,
      eventId: eventsByKey['past-research-forum'].eventId,
      criteriaId: criteriasByKey['I.2'].criteriaId,
      scoreValue: 6,
    },
    {
      studentId: studentsByKey.student1.studentId,
      eventId: eventsByKey['past-green-volunteer'].eventId,
      criteriaId: criteriasByKey['IV.2'].criteriaId,
      scoreValue: 10,
    },
    {
      studentId: studentsByKey.student2.studentId,
      eventId: eventsByKey['past-citizen-week'].eventId,
      criteriaId: criteriasByKey['II.2'].criteriaId,
      scoreValue: 7,
    },
    {
      studentId: studentsByKey.student2.studentId,
      eventId: eventsByKey['past-green-volunteer'].eventId,
      criteriaId: criteriasByKey['IV.2'].criteriaId,
      scoreValue: 10,
    },
    {
      studentId: studentsByKey.student3.studentId,
      eventId: eventsByKey['past-football-cup'].eventId,
      criteriaId: criteriasByKey['III.2'].criteriaId,
      scoreValue: 6,
    },
    {
      studentId: studentsByKey.student4.studentId,
      eventId: eventsByKey['past-leadership-training'].eventId,
      criteriaId: criteriasByKey['V.1'].criteriaId,
      scoreValue: 5,
    },
    {
      studentId: studentsByKey.student5.studentId,
      eventId: eventsByKey['past-blood-donation'].eventId,
      criteriaId: criteriasByKey['IV.2'].criteriaId,
      scoreValue: 10,
    },
  ].map((row) =>
    scoreRepo.create({
      ...row,
      semesterId: null,
    }),
  );

  await scoreRepo.save(scoreRows);
}

async function createDemoSubscriptions(
  studentsByKey: Record<DemoStudentKey, Student>,
  categoriesByKey: Record<DemoCategoryKey, EventCategory>,
  criteriasByKey: Record<DemoCriteriaKey, Criteria>,
) {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);

  const subscriptions = [
    subscriptionRepo.create({
      studentId: studentsByKey.student1.studentId,
      categories: [categoriesByKey.volunteer, categoriesByKey.culture],
      criteria: [criteriasByKey['III.1'], criteriasByKey['IV.2']],
    }),
    subscriptionRepo.create({
      studentId: studentsByKey.student2.studentId,
      categories: [categoriesByKey.volunteer, categoriesByKey.leadership],
      criteria: [criteriasByKey['IV.2'], criteriasByKey['V.1']],
    }),
    subscriptionRepo.create({
      studentId: studentsByKey.student3.studentId,
      categories: [categoriesByKey.culture, categoriesByKey.sport],
      criteria: [criteriasByKey['III.1'], criteriasByKey['III.2']],
    }),
    subscriptionRepo.create({
      studentId: studentsByKey.student4.studentId,
      categories: [categoriesByKey.leadership],
      criteria: [criteriasByKey['V.1'], criteriasByKey['II.4']],
    }),
    subscriptionRepo.create({
      studentId: studentsByKey.student5.studentId,
      categories: [categoriesByKey.volunteer],
      criteria: [criteriasByKey['IV.2'], criteriasByKey['IV.3']],
    }),
    subscriptionRepo.create({
      studentId: studentsByKey.student6.studentId,
      categories: [categoriesByKey.academic],
      criteria: [criteriasByKey['I.2'], criteriasByKey['I.3']],
    }),
  ];

  await subscriptionRepo.save(subscriptions);
}

export async function seedRecommendationDemoData() {
  const role = await ensureNormalUserRole();
  await cleanupDemoData();

  const studentsByKey = await createDemoStudents(role);
  const categoriesByKey = await createDemoCategories();
  const criteriasByKey = await createDemoFrameworkAndCriterias();
  const eventsByKey = await createDemoEvents(categoriesByKey, criteriasByKey);

  await createDemoRegistrations(studentsByKey, eventsByKey);
  await createDemoScores(studentsByKey, eventsByKey, criteriasByKey);
  await createDemoSubscriptions(studentsByKey, categoriesByKey, criteriasByKey);

  console.log('Seeded recommendation demo data successfully');
  console.log('Demo account for testing recommendation:');
  console.log(`- email: ${DEMO_STUDENTS[0].email}`);
  console.log(`- password: ${process.env.DEFAULT_PASSWORD || '123456'}`);
  console.log(`- studentCode: ${DEMO_STUDENTS[0].studentCode}`);
}

async function runSeed() {
  await AppDataSource.initialize();
  try {
    await seedRecommendationDemoData();
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed().catch((error) => {
  console.error('Recommendation seed failed:', error);
  process.exit(1);
});
