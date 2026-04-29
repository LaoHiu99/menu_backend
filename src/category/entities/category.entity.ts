import { Dish } from "src/dish/entities/dish.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'categories'
})
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 50,
        comment: '分类名称（如：热销推荐、经典川菜）'
    })
    title: string;

    @Column({
        type: 'int',
        comment: '排序权重',
        default: 0
    })
    sortOrder: number;

    @Column({
        type: 'tinyint',
        comment: '状态：0-禁用，1-启用',
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

    @OneToMany('Dish', 'category')
    dishes: Dish[];
}
