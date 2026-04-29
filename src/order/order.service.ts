import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-item/entities/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';
import { User } from '../user/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { FriendService } from '../friend/friend.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly friendService: FriendService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const user = await this.userRepository.findOne({ where: { userId: createOrderDto.userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const orderNo = 'ORD' + Date.now();

    const order = this.orderRepository.create({
      orderNo,
      userId: user.id,
      username: user.nickname,
      avatar: user.avatarUrl,
      totalAmount: createOrderDto.totalAmount,
      remark: createOrderDto.remark || '',
      status: 0,
    });

    const savedOrder = await this.orderRepository.save(order);

    for (const item of createOrderDto.items) {
      const dish = await this.dishRepository.findOne({ where: { id: item.dishId } });
      if (!dish) {
        throw new Error(`菜品 ${item.dishId} 不存在`);
      }

      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        dishId: item.dishId,
        dishName: dish.name,
        dishImage: dish.imageUrl,
        price: item.price,
        count: item.quantity,
        subtotal: item.price * item.quantity,
      });

      await this.orderItemRepository.save(orderItem);
    }

    return this.getOrderWithItems(savedOrder.id);
  }

  async getOrdersByUserId(userId: number, status?: number) {
    const where: any = { userId };
    
    if (status !== undefined) {
      where.status = status;
    }
    
    return await this.orderRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getOrdersByUserIdWithPagination(userId: string, status: number, page: number = 1, pageSize: number = 10, includeFriends: boolean = false) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    let userIds = [user.id];

    if (includeFriends) {
      const friendIds = await this.friendService.getFriendIds(userId);
      userIds = [...userIds, ...friendIds];
    }

    const skip = (page - 1) * pageSize;

    const [orders, total] = await this.orderRepository.findAndCount({
      where: userIds.map(id => ({ userId: id, status })),
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await this.orderItemRepository.find({
          where: { orderId: order.id },
        });
        return {
          ...order,
          items,
        };
      })
    );

    return {
      list: ordersWithItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOrderWithItems(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const orderItems = await this.orderItemRepository.find({
      where: { orderId },
    });

    return {
      ...order,
      items: orderItems,
    };
  }

  async updateStatus(orderId: number, status: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('订单不存在');
    }

    order.status = status;
    await this.orderRepository.save(order);

    return this.getOrderWithItems(orderId);
  }

  async remove(orderId: number) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('订单不存在');
    }

    order.status = 2;
    await this.orderRepository.save(order);

    return { message: '订单已删除' };
  }
}
