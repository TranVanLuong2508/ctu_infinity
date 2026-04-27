import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { RolePermission } from '../../modules/role_permission/entities/role_permission.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Student } from '../../modules/students/entities/student.entity';
import { EventCategory } from '../../modules/event_category/entities/event_category.entity';
import { Event } from '../../modules/events/entities/event.entity';
import { EventRegistration } from '../../modules/event-registration/entities/event-registration.entity';
import { StudentScore } from '../../modules/student-score/entities/student-score.entity';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { Organizer } from '../../modules/organizers/entities/organizer.entity';
import { CriteriaFrame } from '../../modules/criteria-frame/entities/criteria-frame.entity';
import { Criteria } from '../../modules/criterias/entities/criteria.entity';
import { Semester } from '../../modules/semesters/entities/semester.entity';
import { AcademicYear } from '../../modules/academic_year/entities/academic_year.entity';
import { Class } from '../../modules/classes/entities/class.entity';
import { Major } from '../../modules/majors/entities/major.entity';
import { Falculty } from '../../modules/falculties/entities/falculty.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'CTU_Infinity',
  entities: [
    User,
    Role,
    RolePermission,
    Permission,
    Student,
    EventCategory,
    Event,
    EventRegistration,
    StudentScore,
    Subscription,
    Organizer,
    CriteriaFrame,
    Criteria,
    Semester,
    AcademicYear,
    Class,
    Major,
    Falculty,
  ],
  synchronize: false,
  logging: process.env.ENABLE_ORM_LOGS === 'true',
});
