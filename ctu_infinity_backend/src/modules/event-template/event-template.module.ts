import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { EventTemplateService } from './event-template.service';
import { EventTemplateController } from './event-template.controller';
import { EventTemplate } from './entities/event-template.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EventTemplate]),
        MulterModule.register(),
    ],
    controllers: [EventTemplateController],
    providers: [EventTemplateService],
    exports: [EventTemplateService],
})
export class EventTemplateModule { }
