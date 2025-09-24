import { Expose } from "class-transformer";

export class CategoryDto {
    @Expose() category_id: number;
    @Expose() name: string;
    @Expose() description?: string;
}

const dtoProps = Object.keys(new CategoryDto());
export const categorySelectFields = dtoProps.map((prop) => {
    return `category.${prop}`;
}).filter((field): field is string => !!field);