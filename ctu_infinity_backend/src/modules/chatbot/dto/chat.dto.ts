import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(1, { message: 'Câu hỏi không được để trống' })
  @MaxLength(2000, { message: 'Câu hỏi không được vượt quá 2000 ký tự' })
  question: string;
}
