import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Student } from '../students/entities/student.entity';
import { EventCategory } from '../event_category/entities/event_category.entity';
import { Criteria } from '../criterias/entities/criteria.entity';
import { CriteriaFrame } from '../criteria-frame/entities/criteria-frame.entity';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(EventCategory)
    private readonly eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(Criteria)
    private readonly criteriaRepository: Repository<Criteria>,
    @InjectRepository(CriteriaFrame)
    private readonly criteriaFrameRepository: Repository<CriteriaFrame>,
  ) {}

  /**
   * Tạo hoặc cập nhật subscription của sinh viên
   * Nếu sinh viên đã có subscription thì cập nhật, nếu chưa thì tạo mới
   * Validate các criteria phải thuộc frame có status = ACTIVE
   */
  async createOrUpdateSubscription(userId: string, dto: CreateSubscriptionDto) {
    try {
      // Tìm student từ userId
      const student = await this.studentRepository.findOne({
        where: { userId },
      });

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy thông tin sinh viên',
        });
      }

      // Validate categoryIds nếu có
      let categories: EventCategory[] = [];
      if (dto.categoryIds && dto.categoryIds.length > 0) {
        categories = await this.eventCategoryRepository.findBy({
          categoryId: In(dto.categoryIds) as any,
        });

        if (categories.length !== dto.categoryIds.length) {
          throw new BadRequestException({
            EC: 0,
            EM: 'Một hoặc nhiều danh mục sự kiện không tồn tại',
          });
        }
      }

      // Validate criteriaIds nếu có
      let criteria: Criteria[] = [];
      if (dto.criteriaIds && dto.criteriaIds.length > 0) {
        criteria = await this.criteriaRepository.find({
          where: { criteriaId: In(dto.criteriaIds) },
          relations: ['framework'],
        });

        if (criteria.length !== dto.criteriaIds.length) {
          throw new BadRequestException({
            EC: 0,
            EM: 'Một hoặc nhiều tiêu chí không tồn tại',
          });
        }

        // Validate các criteria phải thuộc frame có status = ACTIVE
        const invalidCriteria = criteria.filter(
          (c) => c.framework?.status !== FrameworkStatus.ACTIVE,
        );

        if (invalidCriteria.length > 0) {
          const invalidNames = invalidCriteria.map((c) => c.criteriaName).join(', ');
          throw new BadRequestException({
            EC: 0,
            EM: `Các tiêu chí sau không thuộc khung đánh giá đang hoạt động: ${invalidNames}`,
          });
        }
      }

      // Kiểm tra xem sinh viên đã có subscription chưa
      let subscription = await this.subscriptionRepository.findOne({
        where: { studentId: student.studentId },
        relations: ['categories', 'criteria'],
      });

      if (subscription) {
        // Cập nhật subscription hiện có
        subscription.categories = categories;
        subscription.criteria = criteria;
        await this.subscriptionRepository.save(subscription);

        return {
          EC: 1,
          EM: 'Cập nhật đăng ký nhận thông báo thành công',
          data: this.formatSubscriptionResponse(subscription),
        };
      } else {
        // Tạo subscription mới
        subscription = this.subscriptionRepository.create({
          studentId: student.studentId,
          categories,
          criteria,
        });
        await this.subscriptionRepository.save(subscription);

        return {
          EC: 1,
          EM: 'Đăng ký nhận thông báo thành công',
          data: this.formatSubscriptionResponse(subscription),
        };
      }
    } catch (error) {
      console.error('[SubscriptionsService.createOrUpdateSubscription] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi đăng ký nhận thông báo',
      });
    }
  }

  /**
   * Lấy thông tin subscription của sinh viên hiện tại
   */
  async getMySubscription(userId: string) {
    try {
      const student = await this.studentRepository.findOne({
        where: { userId },
      });

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy thông tin sinh viên',
        });
      }

      const subscription = await this.subscriptionRepository.findOne({
        where: { studentId: student.studentId },
        relations: ['categories', 'criteria', 'criteria.framework'],
      });

      if (!subscription) {
        return {
          EC: 1,
          EM: 'Lấy thông tin đăng ký thành công',
          data: {
            subscriptionId: null,
            categories: [],
            criteria: [],
          },
        };
      }

      return {
        EC: 1,
        EM: 'Lấy thông tin đăng ký thành công',
        data: this.formatSubscriptionResponse(subscription),
      };
    } catch (error) {
      console.error('[SubscriptionsService.getMySubscription] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy thông tin đăng ký',
      });
    }
  }

  /**
   * Lấy danh sách tất cả subscriptions (cho admin)
   */
  async getAllSubscriptions() {
    try {
      const subscriptions = await this.subscriptionRepository.find({
        relations: ['student', 'student.user', 'categories', 'criteria', 'criteria.framework'],
      });

      return {
        EC: 1,
        EM: 'Lấy danh sách đăng ký thành công',
        data: subscriptions.map((sub) => ({
          ...this.formatSubscriptionResponse(sub),
          student: {
            studentId: sub.student.studentId,
            studentCode: sub.student.studentCode,
            fullName: sub.student.user?.fullName,
            email: sub.student.user?.email,
          },
        })),
      };
    } catch (error) {
      console.error('[SubscriptionsService.getAllSubscriptions] Error:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy danh sách đăng ký',
      });
    }
  }

  /**
   * Xóa subscription của sinh viên hiện tại
   */
  async deleteMySubscription(userId: string) {
    try {
      const student = await this.studentRepository.findOne({
        where: { userId },
      });

      if (!student) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy thông tin sinh viên',
        });
      }

      const subscription = await this.subscriptionRepository.findOne({
        where: { studentId: student.studentId },
      });

      if (!subscription) {
        throw new NotFoundException({
          EC: 0,
          EM: 'Không tìm thấy đăng ký nhận thông báo',
        });
      }

      await this.subscriptionRepository.remove(subscription);

      return {
        EC: 1,
        EM: 'Hủy đăng ký nhận thông báo thành công',
      };
    } catch (error) {
      console.error('[SubscriptionsService.deleteMySubscription] Error:', error.message);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi hủy đăng ký nhận thông báo',
      });
    }
  }

  /**
   * Lấy danh sách sinh viên đã đăng ký theo categoryId
   */
  async getSubscribersByCategory(categoryId: string) {
    try {
      const subscriptions = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .innerJoinAndSelect('subscription.student', 'student')
        .innerJoinAndSelect('student.user', 'user')
        .innerJoin('subscription.categories', 'category')
        .where('category.categoryId = :categoryId', { categoryId })
        .getMany();

      return {
        EC: 1,
        EM: 'Lấy danh sách sinh viên đăng ký theo danh mục thành công',
        data: subscriptions.map((sub) => ({
          studentId: sub.student.studentId,
          studentCode: sub.student.studentCode,
          fullName: sub.student.user?.fullName,
          email: sub.student.user?.email,
        })),
      };
    } catch (error) {
      console.error('[SubscriptionsService.getSubscribersByCategory] Error:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy danh sách sinh viên đăng ký',
      });
    }
  }

  /**
   * Lấy danh sách sinh viên đã đăng ký theo criteriaId
   */
  async getSubscribersByCriteria(criteriaId: string) {
    try {
      const subscriptions = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .innerJoinAndSelect('subscription.student', 'student')
        .innerJoinAndSelect('student.user', 'user')
        .innerJoin('subscription.criteria', 'criteria')
        .where('criteria.criteriaId = :criteriaId', { criteriaId })
        .getMany();

      return {
        EC: 1,
        EM: 'Lấy danh sách sinh viên đăng ký theo tiêu chí thành công',
        data: subscriptions.map((sub) => ({
          studentId: sub.student.studentId,
          studentCode: sub.student.studentCode,
          fullName: sub.student.user?.fullName,
          email: sub.student.user?.email,
        })),
      };
    } catch (error) {
      console.error('[SubscriptionsService.getSubscribersByCriteria] Error:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy danh sách sinh viên đăng ký',
      });
    }
  }

  /**
   * Format response của subscription
   */
  private formatSubscriptionResponse(subscription: Subscription) {
    return {
      subscriptionId: subscription.subscriptionId,
      categories: (subscription.categories || []).map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        slug: cat.slug,
      })),
      criteria: (subscription.criteria || []).map((crit) => ({
        criteriaId: crit.criteriaId,
        criteriaCode: crit.criteriaCode,
        criteriaName: crit.criteriaName,
        frameworkId: crit.frameworkId,
        frameworkName: crit.framework?.frameworkName,
      })),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
