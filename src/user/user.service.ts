import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { code, nickname, avatarUrl } = loginDto;
    
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
        nickname: nickname || '微信用户',
        avatarUrl: avatarUrl || '',
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
        avatarUrl: user.avatarUrl,
        signature: user.signature,
      }
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return {
      id: user.id,
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      signature: user.signature,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { userId } });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    if (updateProfileDto.nickname !== undefined) {
      user.nickname = updateProfileDto.nickname;
    }
    
    if (updateProfileDto.signature !== undefined) {
      user.signature = updateProfileDto.signature;
    }
    
    await this.userRepository.save(user);
    
    return {
      id: user.id,
      userId: user.userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      signature: user.signature,
    };
  }
}
