import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  userId: string;
  items: CreateOrderItemDto[];
  totalAmount: number;
  remark?: string;
}