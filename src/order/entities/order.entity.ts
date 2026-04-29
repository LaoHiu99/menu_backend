import { OrderItem } from "src/order-item/entities/order-item.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn, OneToMany } from "typeorm";

@Entity({
    name: 'orders'
})
export class Order {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'order_no',
        length: 50,
        comment: '订单编号'
    })
    orderNo: string;

    @Column({
        name: 'user_id',
        comment: '用户ID'
    })
    userId: number;

    @Column({
        length: 50,
        comment: '用户名（快照）'
    })
    username: string;

    @Column({
        length: 200,
        comment: '用户头像（快照）',
        nullable: true
    })
    avatar: string;

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: '订单总金额'
    })
    totalAmount: number;

    @Column({
        length: 200,
        comment: '备注信息',
        nullable: true
    })
    remark: string;

    @Column({
        type: 'tinyint',
        comment: '状态：0-未完成，1-已完成，2-已取消',
        default: 0
    })
    status: number;

    @CreateDateColumn({
        name: 'created_at'
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at'
    })
    updatedAt: Date;

    @ManyToOne('User', 'orders')
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany('OrderItem', 'order')
    orderItems: OrderItem[];
}
