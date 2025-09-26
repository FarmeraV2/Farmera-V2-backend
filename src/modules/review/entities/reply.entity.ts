import { IsNotEmpty, IsString } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Review } from "./review.entity";
import { User } from "src/modules/user/entities/user.entity";

@Entity()
export class Reply {
    @PrimaryGeneratedColumn("increment")
    id: number;

    @Column({ type: "text", nullable: false })
    @IsString()
    @IsNotEmpty()
    reply: string;

    @CreateDateColumn({ type: "timestamptz", nullable: false })
    created: Date;

    @Column({ default: false, name: "is_deleted", nullable: false })
    is_deleted: boolean;

    @ManyToOne(() => Review, (review) => review.replies)
    @JoinColumn({ name: "review_id" })
    review: Review;

    @Column()
    review_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number;
}