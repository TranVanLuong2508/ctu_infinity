import { Controller } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}
}
