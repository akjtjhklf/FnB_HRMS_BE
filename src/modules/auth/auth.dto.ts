import { IsEmail, IsString } from 'class-validator';
import { z } from 'zod';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

// Zod schema for request validation middleware
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;

