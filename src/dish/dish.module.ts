import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishService } from './dish.service';
import { DishController } from './dish.controller';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dish])],
  controllers: [DishController],
  providers: [DishService],
  exports: [DishService],
})
export class DishModule {}
