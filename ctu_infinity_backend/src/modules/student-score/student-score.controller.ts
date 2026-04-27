import { Controller, Get, Param, Query } from '@nestjs/common';
import { StudentScoreService } from './student-score.service';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import { ResponseMessage, User } from 'src/decorators/customize';
import type { IUser } from 'src/interfaces/user.interface';
import { MyScoresFilterDto } from './dto/my-scores-filter.dto';

@Controller('student-scores')
export class StudentScoreController {
  constructor(private readonly studentScoreService: StudentScoreService) { }

  /**
   * Lấy danh sách điểm rèn luyện của sinh viên hiện tại theo bộ lọc.
   */
  @Get('my-scores')
  @Permission('Get my scores', SYSTEM_MODULE.STUDENT_SCORE)
  @ResponseMessage('Get my scores')
  getMyScores(@User() user: IUser, @Query() filterDto: MyScoresFilterDto) {
    return this.studentScoreService.getMyScores(user.userId as string, filterDto);
  }

  /** Lấy toàn bộ điểm (admin) */
  @Get()
  @Permission('Get all student scores', SYSTEM_MODULE.STUDENT_SCORE)
  @ResponseMessage('Get all student scores')
  findAll() {
    return this.studentScoreService.getAll();
  }

  /** Lấy điểm của một sinh viên cụ thể */
  @Get('student/:studentId')
  @Permission('Get student scores by studentId', SYSTEM_MODULE.STUDENT_SCORE)
  @ResponseMessage('Get student scores by studentId')
  getStudentScores(@Param('studentId') studentId: string, @Query('semesterId') semesterId?: string) {
    return this.studentScoreService.getStudentScores(studentId, semesterId);
  }
}
