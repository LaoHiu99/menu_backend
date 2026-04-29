import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Dish } from '../dish/entities/dish.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Dish]), // 必须同时注册 Category 和 Dish
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}