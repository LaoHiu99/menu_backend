import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.create(createOrderDto);
  }

  @Get('user/:userId')
  async getOrders(
    @Param('userId') userId: string,
    @Query('status') status: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('includeFriends') includeFriends: string = 'false',
  ) {
    const statusNum = parseInt(status, 10);
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);

    if (isNaN(statusNum)) {
      throw new Error('status 参数不能为空且必须为数字');
    }

    return await this.orderService.getOrdersByUserIdWithPagination(
      userId,
      statusNum,
      pageNum || 1,
      pageSizeNum || 10,
      includeFriends === 'true',
    );
  }

  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    return await this.orderService.getOrderWithItems(+id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return await this.orderService.updateStatus(+id, updateStatusDto.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.orderService.remove(+id);
  }
}
