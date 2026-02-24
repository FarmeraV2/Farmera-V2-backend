import { Transform } from "class-transformer";
import { registerDecorator, ValidationArguments, ValidatorOptions } from "class-validator";

export function ParseNumberArray(validationOptions?: ValidatorOptions) {
    return function (target: Object, propertyName: string) {
        Transform(({ value }) => {
            if (Array.isArray(value)) return value.map(Number);
            if (typeof value === 'string') {
                if (value.trim() === '') return value;
                return value
                    .split(',')
                    .map(v => Number(v.trim()))
                    .filter(v => !Number.isNaN(v));
            }
            return [];
        })(target, propertyName);

        registerDecorator({
            name: 'ParseNumberArray',
            target: target.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (!Array.isArray(value)) return false;
                    return value.every(v => typeof v === 'number' && Number.isFinite(v));
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a comma-separated list of numbers`;
                },
            },
        });
    }
}