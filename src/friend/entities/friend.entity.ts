import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "src/user/entities/user.entity";

@Entity({
    name: 'friends'
})
export class Friend {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'user_id',
        comment: '用户ID'
    })
    userId: number;

    @Column({
        name: 'friend_id',
        comment: '好友ID'
    })
    friendId: number;

    @Column({
        type: 'tinyint',
        comment: '状态：0-待确认，1-已是好友，2-已拒绝',
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

    @ManyToOne('User', 'friendRelations')
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne('User')
    @JoinColumn({ name: 'friend_id' })
    friend: User;
}
