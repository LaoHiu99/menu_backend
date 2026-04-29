import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { Category } from '../category/entities/category.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createDishDto: CreateDishDto) {
    const category = await this.categoryRepository.findOne({ where: { id: createDishDto.categoryId } });
    if (!category) {
      throw new Error('分类不存在');
    }
    const dish = this.dishRepository.create({
      category,
      name: createDishDto.name,
      description: createDishDto.description,
      price: createDishDto.price ?? 0,
      imageUrl: createDishDto.imageUrl,
      status: createDishDto.status ?? 1,
    });
    return await this.dishRepository.save(dish);
  }

  async update(id: number, updateDishDto: UpdateDishDto) {
    const dish = await this.dishRepository.findOne({ where: { id }, relations: ['category'] });
    if (!dish) {
      throw new Error('菜品不存在');
    }
    if (updateDishDto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({ where: { id: updateDishDto.categoryId } });
      if (!category) {
        throw new Error('分类不存在');
      }
      dish.category = category;
    }
    if (updateDishDto.name !== undefined) dish.name = updateDishDto.name;
    if (updateDishDto.description !== undefined) dish.description = updateDishDto.description;
    if (updateDishDto.price !== undefined) dish.price = updateDishDto.price;
    if (updateDishDto.imageUrl !== undefined) dish.imageUrl = updateDishDto.imageUrl;
    if (updateDishDto.status !== undefined) dish.status = updateDishDto.status;
    return await this.dishRepository.save(dish);
  }

  async remove(id: number) {
    const dish = await this.dishRepository.findOne({ where: { id } });
    if (!dish) {
      throw new Error('菜品不存在');
    }
    dish.status = 0;
    await this.dishRepository.save(dish);
    return { message: '删除成功' };
  }

  async search(keyword: string) {
    return await this.dishRepository.find({
      where: [
        { name: Like(`%${keyword}%`), status: 1 },
        { description: Like(`%${keyword}%`), status: 1 },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
