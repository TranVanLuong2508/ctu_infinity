import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ResponseMessage, User } from 'src/decorators/customize';
import { Permission } from 'src/decorators/permission.decorator';
import { SYSTEM_MODULE } from 'src/common/module';
import type { IUser } from '../users/interface/user.interface';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Sinh viên tạo hoặc cập nhật subscription của mình
   * POST /subscriptions
   * Body: { categoryIds?: string[], criteriaIds?: string[] }
   */
  @Post()
  @Permission('Create or update subscription', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Create or update subscription')
  createOrUpdate(@User() user: IUser, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createOrUpdateSubscription(user.userId, dto);
  }

  /**
   * Sinh viên lấy thông tin subscription của mình
   * GET /subscriptions/me
   */
  @Get('me')
  @Permission('Get my subscription', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Get my subscription')
  getMySubscription(@User() user: IUser) {
    return this.subscriptionsService.getMySubscription(user.userId);
  }

  /**
   * Sinh viên cập nhật subscription của mình
   * PUT /subscriptions/me
   * Body: { categoryIds?: string[], criteriaIds?: string[] }
   */
  @Put('me')
  @Permission('Update my subscription', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Update my subscription')
  updateMySubscription(@User() user: IUser, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.createOrUpdateSubscription(user.userId, dto);
  }

  /**
   * Sinh viên xóa/hủy subscription của mình
   * DELETE /subscriptions/me
   */
  @Delete('me')
  @Permission('Delete my subscription', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Delete my subscription')
  deleteMySubscription(@User() user: IUser) {
    return this.subscriptionsService.deleteMySubscription(user.userId);
  }

  /**
   * Admin lấy tất cả subscriptions
   * GET /subscriptions
   */
  @Get()
  @Permission('Get all subscriptions', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Get all subscriptions')
  getAllSubscriptions() {
    return this.subscriptionsService.getAllSubscriptions();
  }

  /**
   * Lấy danh sách sinh viên đăng ký theo category
   * GET /subscriptions/category/:categoryId
   */
  @Get('category/:categoryId')
  @Permission('Get subscribers by category', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Get subscribers by category')
  getSubscribersByCategory(@Param('categoryId') categoryId: string) {
    return this.subscriptionsService.getSubscribersByCategory(categoryId);
  }

  /**
   * Lấy danh sách sinh viên đăng ký theo criteria
   * GET /subscriptions/criteria/:criteriaId
   */
  @Get('criteria/:criteriaId')
  @Permission('Get subscribers by criteria', SYSTEM_MODULE.SUBSCRIPTION)
  @ResponseMessage('Get subscribers by criteria')
  getSubscribersByCriteria(@Param('criteriaId') criteriaId: string) {
    return this.subscriptionsService.getSubscribersByCriteria(criteriaId);
  }
}
