import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      status: createCategoryDto.status ?? 1,
      sortOrder: createCategoryDto.sortOrder ?? 0,
    });
    return await this.categoryRepository.save(category);
  }

  /** 后台：全部类目（含禁用），不加载菜品以减轻负载 */
  async findAllForAdmin() {
    return await this.categoryRepository.find({
      order: { parentId: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  // 修改 findAll 方法 - 使用 QueryBuilder
  async findAll() {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.dishes', 'dish')
      .where('category.status = :status', { status: 1 })
      .orderBy('category.parent_id', 'ASC')
      .addOrderBy('category.sort_order', 'ASC')
      .addOrderBy('category.id', 'ASC')
      .addOrderBy('dish.sort_order', 'ASC')
      .addOrderBy('dish.id', 'ASC')
      .getMany();
    
    categories.forEach(category => {
      console.log(`Category ${category.title} (id: ${category.id}) has ${category.dishes?.length || 0} dishes`);
      if (category.dishes && category.dishes.length > 0) {
        category.dishes.forEach(dish => {
          console.log(`  - Dish: ${dish.name}, status: ${dish.status}`);
        });
      }
    });
    
    return categories;
  }

  // 修改 findOne 方法 - 也要加载 dishes
  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['dishes'],
    });

    if (!category) {
      throw new Error('分类不存在');
    }
    if (category.dishes?.length) {
      category.dishes.sort((a, b) => {
        const ao = a.sortOrder ?? 0;
        const bo = b.sortOrder ?? 0;
        if (ao !== bo) return ao - bo;
        return a.id - b.id;
      });
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    category.status = 0;
    await this.categoryRepository.save(category);
    return { message: '删除成功' };
  }

}