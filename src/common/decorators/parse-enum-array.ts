
import { Transform } from 'class-transformer';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function ParseEnumArray<T extends object>(
    enumType: T,
    validationOptions?: ValidationOptions,
) {
    return function (target: Object, propertyName: string) {
        Transform(({ value }) => {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                return value.split(',').map(v => v.trim());
            }
            return [];
        })(target, propertyName);

        registerDecorator({
            name: 'ParseEnumArray',
            target: target.constructor,
            propertyName,
            constraints: [enumType],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [enumObj] = args.constraints;

                    if (!Array.isArray(value)) return false;

                    const enumValues = Object.values(enumObj);
                    return value.every(v => enumValues.includes(v));
                },
                defaultMessage(args: ValidationArguments) {
                    const [enumObj] = args.constraints;
                    return `${args.property} must be an array of valid enum values: ${Object.values(enumObj).join(', ')}`;
                },
            },
        });
    };
}
