import { Order } from "src/order/entities/order.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({
    name: 'users'
})
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'user_id',
        length: 50,
        comment: '用户编号'
    })
    userId: string;

    @Column({
        length: 100,
        comment: '微信openid，用于登录识别',
        nullable: true
    })
    openid: string;

    @Column({
        name: 'nickname',
        length: 50,
        comment: '用户昵称'
    })
    nickname: string;

    @Column({
        name: 'avatar_url',
        length: 200,
        comment: '头像地址',
        nullable: true
    })
    avatarUrl: string;

    @Column({
        name: 'signature',
        length: 200,
        comment: '个性签名',
        nullable: true,
        default: ''
    })
    signature: string;

    @Column({
        name: 'phone',
        length: 20,
        comment: '手机号',
        nullable: true
    })
    phone: string;

    @Column({
        type: 'tinyint',
        comment: '状态：0-禁用，1-正常',
        default: 1
    })
    status: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        comment: '创建时间'
        
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        comment: '更新时间'
    })
    updatedAt: Date;

    @OneToMany('Order', 'user')
    orders: Order[];
}
