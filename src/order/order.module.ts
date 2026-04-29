import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';
import { User } from '../user/entities/user.entity';
import { FriendModule } from '../friend/friend.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Dish, User]), FriendModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
