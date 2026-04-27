import { Body, Controller, Post } from '@nestjs/common';
import { ResponseMessage, SkipCheckPermission, User } from 'src/decorators/customize';
import { ChatbotService } from './chatbot.service';
import { ChatDto } from './dto/chat.dto';

@Controller('chatbot')
@SkipCheckPermission()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * POST /api/v1/chatbot/chat
   * Yêu cầu JWT — userId được lấy từ token để truy vấn đúng dữ liệu sinh viên.
   */
  @Post('chat')
  @ResponseMessage('Chat with chatbot')
  chat(@User('userId') userId: string, @Body() dto: ChatDto) {
    return this.chatbotService.handleChat(userId, dto.question);
  }
}
