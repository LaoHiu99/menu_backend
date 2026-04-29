import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from './entities/friend.entity';
import { User } from '../user/entities/user.entity';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(sendFriendRequestDto: SendFriendRequestDto) {
    const user = await this.userRepository.findOne({ where: { userId: sendFriendRequestDto.userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const friend = await this.userRepository.findOne({ where: { userId: sendFriendRequestDto.friendUserId } });
    if (!friend) {
      throw new Error('好友不存在');
    }

    if (user.id === friend.id) {
      throw new Error('不能添加自己为好友');
    }

    const existingRequest = await this.friendRepository.findOne({
      where: [
        { userId: user.id, friendId: friend.id },
        { userId: friend.id, friendId: user.id },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 1) {
        throw new Error('已经是好友了');
      }
      if (existingRequest.status === 0) {
        throw new Error('已发送好友请求，请等待对方确认');
      }
    }

    const friendRequest = this.friendRepository.create({
      userId: user.id,
      friendId: friend.id,
      status: 0,
    });

    await this.friendRepository.save(friendRequest);

    return { message: '好友请求已发送' };
  }

  async getFriendRequests(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const requests = await this.friendRepository.find({
      where: { friendId: user.id, status: 0 },
      relations: ['user', 'friend'],
      order: { createdAt: 'DESC' },
    });

    return requests;
  }

  async acceptFriendRequest(requestId: number, userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const request = await this.friendRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new Error('好友请求不存在');
    }

    if (request.friendId !== user.id) {
      throw new Error('无权操作此好友请求');
    }

    if (request.status !== 0) {
      throw new Error('该请求已处理');
    }

    request.status = 1;
    await this.friendRepository.save(request);

    const reverseFriend = this.friendRepository.create({
      userId: request.friendId,
      friendId: request.userId,
      status: 1,
    });
    await this.friendRepository.save(reverseFriend);

    return { message: '已接受好友请求' };
  }

  async rejectFriendRequest(requestId: number, userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const request = await this.friendRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new Error('好友请求不存在');
    }

    if (request.friendId !== user.id) {
      throw new Error('无权操作此好友请求');
    }

    if (request.status !== 0) {
      throw new Error('该请求已处理');
    }

    request.status = 2;
    await this.friendRepository.save(request);

    return { message: '已拒绝好友请求' };
  }

  async getFriendList(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const friends = await this.friendRepository.find({
      where: { userId: user.id, status: 1 },
      relations: ['friend'],
      order: { createdAt: 'DESC' },
    });

    return friends;
  }

  async removeFriend(friendId: number, userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const friend = await this.userRepository.findOne({ where: { id: friendId } });
    if (!friend) {
      throw new Error('好友不存在');
    }

    await this.friendRepository.delete({ userId: user.id, friendId: friend.id });
    await this.friendRepository.delete({ userId: friend.id, friendId: user.id });

    return { message: '已删除好友' };
  }

  async getFriendIds(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const friends = await this.friendRepository.find({
      where: { userId: user.id, status: 1 },
    });

    return friends.map(f => f.friendId);
  }
}
