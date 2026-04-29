import { Dish } from "src/dish/entities/dish.entity";
import { Order } from "src/order/entities/order.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";

@Entity({
    name: 'order_items'
})
export class OrderItem {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'order_id',
        comment: '订单ID'
    })
    orderId: number;

    @Column({
        name: 'dish_id',
        comment: '菜品ID'
    })
    dishId: number;

    @Column({
        name: 'dish_name',
        length: 100,
        comment: '菜品名称（快照）'
    })
    dishName: string;

    @Column({
        name: 'dish_image',
        length: 200,
        comment: '菜品图片（快照）',
        nullable: true
    })
    dishImage: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: '单价'
    })
    price: number;

    @Column({
        comment: '数量'
    })
    count: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: '小计金额'
    })
    subtotal: number;

    @ManyToOne('Order', 'orderItems')
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne('Dish')
    @JoinColumn({ name: 'dish_id' })
    dish: Dish;
}
