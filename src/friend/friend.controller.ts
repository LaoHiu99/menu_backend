import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { FriendService } from './friend.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request')
  async sendFriendRequest(@Body() sendFriendRequestDto: SendFriendRequestDto) {
    return await this.friendService.sendFriendRequest(sendFriendRequestDto);
  }

  @Get('requests/:userId')
  async getFriendRequests(@Param('userId') userId: string) {
    return await this.friendService.getFriendRequests(userId);
  }

  @Put('request/:id/accept')
  async acceptFriendRequest(@Param('id') id: string, @Query('userId') userId: string) {
    return await this.friendService.acceptFriendRequest(+id, userId);
  }

  @Put('request/:id/reject')
  async rejectFriendRequest(@Param('id') id: string, @Query('userId') userId: string) {
    return await this.friendService.rejectFriendRequest(+id, userId);
  }

  @Get('list/:userId')
  async getFriendList(@Param('userId') userId: string) {
    return await this.friendService.getFriendList(userId);
  }

  /** friendUserId 为业务用户编号，如 USER1777451236548（与添加好友时输入的一致） */
  @Delete('user/:friendUserId')
  async removeFriend(
    @Param('friendUserId') friendUserId: string,
    @Query('userId') userId: string,
  ) {
    return await this.friendService.removeFriendByBusinessUserId(
      userId,
      friendUserId,
    );
  }
}
