import { Controller, Post, Put, Delete, Body, Param, Get, Query } from '@nestjs/common';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  async create(@Body() createDishDto: CreateDishDto) {
    return await this.dishService.create(createDishDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDishDto: UpdateDishDto) {
    return await this.dishService.update(+id, updateDishDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.dishService.remove(+id);
  }

  @Get('search')
  async search(@Query('keyword') keyword: string) {
    return await this.dishService.search(keyword);
  }
}
