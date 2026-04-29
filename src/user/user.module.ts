import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Order]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'menu_secret_key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
