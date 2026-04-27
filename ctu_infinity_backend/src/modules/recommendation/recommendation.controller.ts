import { Controller, Get, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { GetRecommendationQueryDto } from './dto/get-recommendation-query.dto';

@Controller('recommendation')
@SkipCheckPermission()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('content')
  @ResponseMessage('Get content recommendations')
  getContentRecommendations(
    @User('userId') userId: string,
    @Query() query: GetRecommendationQueryDto,
  ) {
    return this.recommendationService.getRecommendationsForStudent(userId, 'content', query);
  }

  @Get('dataset')
  getDataSet(@User('userId') userId: string) {
    return this.recommendationService.getDataSet(userId);
  }

  @Get('collab')
  @ResponseMessage('Get collaborative recommendations')
  getCollabRecommendations(
    @User('userId') userId: string,
    @Query() query: GetRecommendationQueryDto,
  ) {
    return this.recommendationService.getRecommendationsForStudent(userId, 'collab', query);
  }

  @Get('hybrid')
  @ResponseMessage('Get hybrid recommendations')
  getHybridRecommendations(
    @User('userId') userId: string,
    @Query() query: GetRecommendationQueryDto,
  ) {
    console.log('[RecommendationController] /hybrid called, userId:', userId);
    return this.recommendationService.getRecommendationsForStudent(userId, 'hybrid', query);
  }
}
