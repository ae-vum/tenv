import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export type PrimitiveType = 'string' | 'number' | 'boolean';

export type SchemaEntry =
    | {
        type: PrimitiveType;
        required?: boolean;
        default?: any;
        allowedValues?: any[];
        regex?: RegExp;
        validation?: (value: any) => boolean;
        sensitive?: boolean;
    }
    | {
        type: 'array';
        items: PrimitiveType;
        required?: boolean;
        default?: any[];
        validation?: (value: any[]) => boolean;
        sensitive?: boolean;
    };

export type Schema = { [key: string]: SchemaEntry };

export type ErrorStrategy = 'throw' | 'log' | 'default';

export interface LoadEnvOptions {
    schema: Schema;
    dotEnvPath?: string;
    errorStrategy?: ErrorStrategy;
}

type InferType<T extends SchemaEntry> = T extends { type: 'string' }
    ? string
    : T extends { type: 'number' }
    ? number
    : T extends { type: 'boolean' }
    ? boolean
    : T extends { type: 'array'; items: infer U }
    ? U extends PrimitiveType
    ? InferPrimitive<U>[]
    : never
    : never;

type InferPrimitive<T extends PrimitiveType> = T extends 'string'
    ? string
    : T extends 'number'
    ? number
    : T extends 'boolean'
    ? boolean
    : never;

type InferEnv<S extends Schema> = {
    [K in keyof S]: InferType<S[K]>;
};

export function loadEnv<S extends Schema>(options: LoadEnvOptions): InferEnv<S> {
    const envPath = options.dotEnvPath || '.env';
    const envFilePath = path.resolve(process.cwd(), envPath);

    if (fs.existsSync(envFilePath)) {
        dotenv.config({ path: envFilePath });
    }

    const result: any = {};
    const errors: string[] = [];

    for (const key in options.schema) {
        const entry = options.schema[key];
        const rawValue = process.env[key];
        let value = rawValue === undefined ? entry.default : rawValue;

        if (value === undefined && entry.required) {
            errors.push(`Environment variable '${key}' is required but not defined.`);
            continue;
        }

        if (value === undefined) {
            result[key] = value;
            continue;
        }

        const parsedValue = parseValue(entry.type, value);

        if (parsedValue === undefined) {
            errors.push(`Environment variable '${key}' cannot be parsed as type '${entry.type}'.`);
            continue;
        }

        if ("allowedValues" in entry && entry.allowedValues && !entry.allowedValues.includes(parsedValue)) {
            errors.push(
                `Environment variable '${key}' has invalid value '${parsedValue}'. Allowed values are: ${entry.allowedValues.join(
                    ', '
                )}.`
            );
            continue;
        }

        if ("regex" in entry && entry.regex && !entry.regex.test(parsedValue)) {
            errors.push(`Environment variable '${key}' does not match the required pattern.`);
            continue;
        }

        if (entry.validation && !entry.validation(parsedValue)) {
            errors.push(`Custom validation failed for environment variable '${key}'.`);
            continue;
        }

        result[key] = parsedValue;
    }

    handleErrors(errors, options.errorStrategy || 'throw');

    return result as InferEnv<S>;
}

function parseValue(type: PrimitiveType | 'array', value: string): any {
    if (type === 'string') {
        return value;
    } else if (type === 'number') {
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    } else if (type === 'boolean') {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return undefined;
    } else if (type === 'array') {
        try {
            const arr = JSON.parse(value);
            return Array.isArray(arr) ? arr : undefined;
        } catch {
            return undefined;
        }
    }
}

function handleErrors(errors: string[], strategy: ErrorStrategy) {
    if (errors.length === 0) return;

    const message = errors.join('\n');

    if (strategy === 'throw') {
        throw new Error(message);
    } else if (strategy === 'log') {
        console.warn(message);
    }
}
