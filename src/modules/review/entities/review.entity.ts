import { IsNotEmpty, IsString, Max, Min } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Reply } from "./reply.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Product } from "src/modules/product/entities/product.entity";

@Entity("reviews")
export class Review {
    @PrimaryGeneratedColumn()
    review_id: number;

    @Column()
    @Min(1)
    @Max(5)
    rating: number;

    @Column()
    @IsString()
    @IsNotEmpty()
    content: string;

    @Column("text", { array: true, nullable: true })
    image_urls: string[] | null;

    @Column("text", { array: true, nullable: true })
    video_urls: string[] | null;

    @Column({ default: false })
    seller_approved: boolean;

    @Column({ default: false, name: "is_deleted" })
    is_deleted: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    created: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: number;

    @ManyToOne(() => Product, (product) => product.reviews)
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column()
    product_id: number;

    @OneToMany(() => Reply, (reply) => reply.review)
    replies: Reply[];

    // @Column({ name: "order_detail_id" })
    // order_detailId: number;
}