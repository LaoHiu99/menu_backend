import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.userService.login(loginDto);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return await this.userService.getProfile(userId);
  }

  @Put('profile/:userId')
  async updateProfile(@Param('userId') userId: string, @Body() updateProfileDto: UpdateProfileDto) {
    return await this.userService.updateProfile(userId, updateProfileDto);
  }
}
