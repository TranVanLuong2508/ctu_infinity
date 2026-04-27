import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentScore } from './entities/student-score.entity';
import { CriteriasService } from 'src/modules/criterias/criterias.service';
import { Student } from '../students/entities/student.entity';
import { MyScoresFilterDto } from './dto/my-scores-filter.dto';

@Injectable()
export class StudentScoreService {
  constructor(
    @InjectRepository(StudentScore)
    private readonly scoreRepository: Repository<StudentScore>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly criteriasService: CriteriasService,
    private readonly dataSource: DataSource,
  ) {}

  private ensureNaturalInteger(value: number, fieldName: string): number {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`${fieldName} phải là số nguyên không âm`);
    }
    return value;
  }

  // ─── ADD SCORE (dùng transaction) ─────────────────────────────────────────────

  /**
   * Cộng điểm cho sinh viên sau khi attendance được APPROVED.
   *
   * Logic cap điểm:
   *  1. SUM điểm hiện tại của sinh viên theo criteriaId
   *  2. Nếu tổng >= maxScore: KHÔNG cộng thêm
   *  3. Nếu tổng + score > maxScore: chỉ cộng phần còn thiếu (maxScore - tổng)
   *  4. Tạo record mới trong student_scores với scoreValue thực tế được cộng
   */
  async addScore(
    studentId: string,
    eventId: string,
    criteriaId: string,
    score: number,
  ): Promise<void> {
    const normalizedScore = this.ensureNaturalInteger(score, 'score');

    await this.dataSource.transaction(async (manager) => {
      // Lấy criterias để biết maxScore
      const criteriaData = await this.criteriasService.findOne(criteriaId);
      if (!criteriaData || (criteriaData as any).EC === 0) {
        throw new BadRequestException('Không tìm thấy tiêu chí để cộng điểm');
      }

      const rawMaxScore =
        (criteriaData as any).maxScore ?? (criteriaData as any).criteriaData?.maxScore;
      const normalizedMaxScore =
        rawMaxScore === null || rawMaxScore === undefined
          ? null
          : this.ensureNaturalInteger(Number(rawMaxScore), 'maxScore');

      // SUM điểm hiện tại của sinh viên theo criteria
      const { currentTotal } = await manager
        .createQueryBuilder(StudentScore, 'ss')
        .select('COALESCE(SUM(ss.scoreValue), 0)', 'currentTotal')
        .where('ss.studentId = :studentId', { studentId })
        .andWhere('ss.criteriaId = :criteriaId', { criteriaId })
        .getRawOne();

      const current = Number(currentTotal ?? 0);
      if (!Number.isFinite(current) || !Number.isInteger(current) || current < 0) {
        throw new BadRequestException('Dữ liệu tổng điểm hiện tại không hợp lệ');
      }

      // Kiểm tra đã đạt maxScore chưa
      if (normalizedMaxScore !== null && current >= normalizedMaxScore) {
        return; // Đã đủ điểm criteria, không cộng thêm
      }

      // Tính số điểm thực được cộng (có thể bị cap)
      let toAdd = normalizedScore;
      if (normalizedMaxScore !== null) {
        toAdd = Math.min(normalizedScore, normalizedMaxScore - current);
      }

      if (toAdd <= 0) {
        return; // Không còn chỗ để cộng
      }

      // Tạo record mới
      const newScore = manager.create(StudentScore, {
        studentId,
        eventId,
        criteriaId,
        scoreValue: toAdd,
      });

      await manager.save(newScore);
    });
  }

  // ─── ADD SCORE (không cap — dùng cho event check-in) ─────────────────────────

  /**
   * Cộng điểm cho sinh viên khi tham gia sự kiện.
   *
   * Khác với addScore(), method này KHÔNG áp dụng logic cap theo criteria.maxScore.
   * scoreValue được ghi nhận = đúng bằng event.score.
   * Logic hiển thị / cảnh báo khi tổng vượt maxScore sẽ xử lý ở frontend.
   *
   * @param studentId  - ID của sinh viên
   * @param eventId    - ID của sự kiện (dùng để link record student_scores → event)
   * @param criteriaId - ID của tiêu chí rèn luyện liên kết với sự kiện
   * @param score      - Điểm của sự kiện (event.score), ghi nhận nguyên vẹn
   */
  async addScoreForEvent(
    studentId: string,
    eventId: string,
    criteriaId: string,
    score: number,
    semesterId: string | null,
  ): Promise<void> {
    try {
      console.log('[addScoreForEvent] semesterId =', semesterId, '| eventId =', eventId);
      const normalizedScore = this.ensureNaturalInteger(score, 'score');

      const newScore = this.scoreRepository.create({
        studentId,
        eventId,
        criteriaId,
        scoreValue: normalizedScore,
        semesterId,
      });
      await this.scoreRepository.save(newScore);
    } catch (error) {
      console.error('[StudentScoreService.addScoreForEvent] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi cộng điểm sự kiện' });
    }
  }

  // ─── GET STUDENT SCORES ────────────────────────────────────────────────────────

  /**
   * Lấy điểm của sinh viên hiện tại kèm theo filter startDate, endDate
   */
  async getMyScores(userId: string, filter: MyScoresFilterDto) {
    try {
      const student = await this.studentRepository.findOne({ where: { userId } });
      if (!student) {
        throw new NotFoundException({ EC: 0, EM: 'Không tìm thấy thông tin sinh viên' });
      }

      const queryBuilder = this.scoreRepository.createQueryBuilder('ss')
        .leftJoinAndSelect('ss.event', 'event')
        .where('ss.studentId = :studentId', { studentId: student.studentId });

      // Ưu tiên lọc theo semesterId nếu có
      if (filter.semesterId) {
        queryBuilder.andWhere('ss.semesterId = :semesterId', { semesterId: filter.semesterId });
      } else {
        // Fallback: lọc theo date range của sự kiện
        if (filter.startDate) {
          queryBuilder.andWhere('event.startDate >= :startDate', { startDate: filter.startDate });
        }
        if (filter.endDate) {
          queryBuilder.andWhere('event.startDate <= :endDate', { endDate: filter.endDate });
        }
      }

      const records = await queryBuilder.orderBy('ss.createdAt', 'DESC').getMany();

      // Tính tổng theo từng criteria
      const totals: Record<string, number> = {};
      for (const r of records) {
        const key = r.criteriaId;
        totals[key] = (totals[key] ?? 0) + Number(r.scoreValue);
      }

      return {
        EC: 1,
        EM: 'Lấy điểm sinh viên thành công',
        scores: records,
        totalsByCriteriaId: totals,
      };
    } catch (error) {
      console.error('[StudentScoreService.getMyScores] Error:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy điểm sinh viên' });
    }
  }

  /**
   * Trả về danh sách điểm của sinh viên, kèm tổng theo từng criteria.
   */
  async getStudentScores(studentId: string, semesterId?: string) {
    try {
      const where: any = { studentId };
      if (semesterId) {
        where.semesterId = semesterId;
      }
      const records = await this.scoreRepository.find({
        where,
        relations: ['event'],
        order: { createdAt: 'DESC' },
      });

      // Tính tổng theo từng criteria
      const totals: Record<string, number> = {};
      for (const r of records) {
        const key = r.criteriaId;
        totals[key] = (totals[key] ?? 0) + Number(r.scoreValue);
      }

      return {
        EC: 1,
        EM: 'Lấy điểm sinh viên thành công',
        scores: records,
        totalsByCriteriaId: totals,
      };
    } catch (error) {
      console.error('Error getting student scores:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy điểm sinh viên' });
    }
  }

  /** Lấy toàn bộ điểm (admin) */
  async getAll() {
    try {
      const records = await this.scoreRepository.find({
        relations: ['event'],
        order: { createdAt: 'DESC' },
      });
      return { EC: 1, EM: 'Lấy toàn bộ điểm thành công', scores: records };
    } catch (error) {
      console.error('Error getting all student scores:', error.message);
      throw new InternalServerErrorException({ EC: 0, EM: 'Lỗi khi lấy điểm' });
    }
  }
}
