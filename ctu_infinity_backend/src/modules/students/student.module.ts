import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Student } from './entities/student.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Major } from '../majors/entities/major.entity';
import { Falculty } from '../falculties/entities/falculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, User, Class, Major, Falculty])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule { }
