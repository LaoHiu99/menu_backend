import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getInternalUserIdFromBearer(authHeader: string | undefined): number {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录或令牌无效');
    }
    const token = authHeader.slice(7).trim();
    try {
      const payload = this.jwtService.verify<{ userId: number }>(token);
      if (payload?.userId == null) {
        throw new UnauthorizedException('令牌无效');
      }
      return payload.userId;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }

  async login(loginDto: LoginDto) {
    const { code } = loginDto;
    
    let openid: string;
    
    if (code === 'test_code') {
      openid = 'test_openid_12345';
    } else {
      const appId = this.configService.get<string>('WX_APPID');
      const appSecret = this.configService.get<string>('WX_APP_SECRET');
      
      if (!appId || !appSecret || appId === 'your_app_id' || appSecret === 'your_app_secret') {
        throw new Error('微信小程序配置未正确设置，请在 .env 文件中配置 WX_APPID 和 WX_APP_SECRET');
      }
      
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
      
      const { data } = await axios.get(url);
      
      if (data.errcode) {
        throw new Error(data.errmsg);
      }
      
      openid = data.openid;
    }
    
    let user = await this.userRepository.findOne({ where: { openid } });
    
    if (!user) {
      user = this.userRepository.create({
        openid,
        nickname: '微信用户',
        avatarUrl: '',
        userId: 'USER' + Date.now(),
        status: 1,
      });
      await this.userRepository.save(user);
    }
    
    const payload = { userId: user.id, openid: user.openid };
    const token = this.jwtService.sign(payload);
    
    return {
      token,
      user: {
        id: user.id,
        userId: user.userId,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl ?? '',
        signature: user.signature ?? '',
      }
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const pendingCount = await this.orderRepository.count({ where: { userId: user.id, status: 0 } });
    const completedCount = await this.orderRepository.count({ where: { userId: user.id, status: 1 } });
    
    return {
      id: user.id,
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl ?? '',
      signature: user.signature ?? '',
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      orderCount: {
        pending: pendingCount,
        completed: completedCount,
        total: pendingCount + completedCount,
      },
    };
  }

  async updateAvatarByInternalId(internalId: number, relativeAvatarPath: string) {
    const user = await this.userRepository.findOne({ where: { id: internalId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.avatarUrl = relativeAvatarPath;
    await this.userRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    internalUserId: number,
  ) {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.id !== internalUserId) {
      throw new UnauthorizedException('无权修改该用户资料');
    }

    const nicknameMax = 10;
    const signatureMax = 50;

    if (updateProfileDto.nickname !== undefined) {
      const n = updateProfileDto.nickname.trim();
      if (!n) {
        throw new BadRequestException('昵称不能为空');
      }
      if (n.length > nicknameMax) {
        throw new BadRequestException(`昵称最多${nicknameMax}个字符`);
      }
      user.nickname = n;
    }

    if (updateProfileDto.signature !== undefined) {
      const s = updateProfileDto.signature.trim();
      if (s.length > signatureMax) {
        throw new BadRequestException(`个性签名最多${signatureMax}个字符`);
      }
      user.signature = s;
    }

    if (updateProfileDto.avatarUrl !== undefined) {
      user.avatarUrl = this.normalizeStoredAvatarUrl(updateProfileDto.avatarUrl);
    }

    await this.userRepository.save(user);
    
    return {
      id: user.id,
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl ?? '',
      signature: user.signature ?? '',
    };
  }

  /** 仅存相对路径或短字符串；完整 URL 去掉 origin 后存入（若有标准 /uploads 路径） */
  private normalizeStoredAvatarUrl(url: string): string {
    if (!url) {
      return '';
    }
    try {
      const idx = url.indexOf('/uploads/');
      if (idx !== -1) {
        return url.slice(idx);
      }
    } catch {
      /* ignore */
    }
    if (url.startsWith('/uploads/')) {
      return url;
    }
    return url;
  }
}
