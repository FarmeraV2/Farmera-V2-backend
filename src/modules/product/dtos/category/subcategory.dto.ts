import { Expose } from "class-transformer";

export class SubcategoryDto {
    @Expose() subcategory_id: number;
    @Expose() description: string;
}

const dtoProps = Object.keys(new SubcategoryDto());
export const subcategorySelectFields = dtoProps.map((prop) => {
    return `subcategory.${prop}`;
});