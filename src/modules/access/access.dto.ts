import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class AssignAccessDto {
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @IsNotEmpty()
  @IsString()
  roleId!: string;

  @IsArray()
  @IsString({ each: true })
  policyIds!: string[];
}
