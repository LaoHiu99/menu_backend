import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { DishModule } from './dish/dish.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './order-item/order-item.module';
import { FriendModule } from './friend/friend.module';
import { User } from './user/entities/user.entity';
import { Category } from './category/entities/category.entity';
import { Dish } from './dish/entities/dish.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order-item/entities/order-item.entity';
import { Friend } from './friend/entities/friend.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3307", 10),
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "123456",
      database: process.env.DB_DATABASE || "menu_system",
      synchronize: true,
      logging: true,
      entities: [User, Category, Dish, Order, OrderItem, Friend],
      poolSize: 10,
      timezone: '+00:00',
      connectorPackage: 'mysql2',
      extra: {
          authPlugin: 'sha256_password',
      }
    }),
    UserModule,
    CategoryModule,
    DishModule,
    OrderModule,
    OrderItemModule,
    FriendModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
