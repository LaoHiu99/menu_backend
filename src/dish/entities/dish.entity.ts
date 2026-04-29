import { Category } from "../../category/entities/category.entity";
import { OrderItem } from "../../order-item/entities/order-item.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from "typeorm";

@Entity({
    name: 'dishes'
})
export class Dish {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100,
        comment: '菜品名称'
    })
    name: string;

    @Column({
        type: 'text',
        comment: '菜品描述',
        nullable: true
    })
    description: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: '价格',
        default: 0
    })
    price: number;

    @Column({
        name: 'image_url',
        length: 200,
        comment: '菜品图片地址',
        nullable: true
    })
    imageUrl: string;

    @Column({
        type: 'tinyint',
        comment: '状态：0-下架，1-上架',
        default: 1
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

    @ManyToOne(() => Category, category => category.dishes)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => OrderItem, orderItem => orderItem.dish)
    orderItems: OrderItem[];
}