import { loadEnv } from '../index';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const testEnvPath = path.join(__dirname, '.test.env');

describe('loadEnv', () => {
    beforeEach(() => {
        if (fs.existsSync(testEnvPath)) {
            fs.unlinkSync(testEnvPath);
        }
        jest.resetModules();
        process.env = {};
    });

    afterAll(() => {
        if (fs.existsSync(testEnvPath)) {
            fs.unlinkSync(testEnvPath);
        }
    });

    it('should load environment variables from .env file', () => {
        fs.writeFileSync(testEnvPath, 'TEST_VAR=test_value\nNUMBER_VAR=123');

        const schema = z.object({
            TEST_VAR: z.string(),
            NUMBER_VAR: z.coerce.number(),
        });

        const env = loadEnv({ schema, dotEnvPath: testEnvPath, errorStrategy: 'silent' });

        expect(env.TEST_VAR).toBe('test_value');
        expect(env.NUMBER_VAR).toBe(123);
    });

    it('should load environment variables from system environment', () => {
        process.env.SYSTEM_VAR = 'system_value';
        process.env.NUMBER_VAR = '456';

        const schema = z.object({
            SYSTEM_VAR: z.string(),
            NUMBER_VAR: z.coerce.number(),
        });

        const env = loadEnv({ schema, errorStrategy: 'silent' });

        expect(env.SYSTEM_VAR).toBe('system_value');
        expect(env.NUMBER_VAR).toBe(456);
    });

    it('should prioritize system environment variables over .env file', () => {
        fs.writeFileSync(testEnvPath, 'TEST_VAR=env_value\nSYSTEM_VAR=env_system_value');
        process.env.SYSTEM_VAR = 'system_value';

        const schema = z.object({
            TEST_VAR: z.string(),
            SYSTEM_VAR: z.string(),
        });

        const env = loadEnv({ schema, dotEnvPath: testEnvPath, errorStrategy: 'silent' });

        expect(env.TEST_VAR).toBe('env_value');
        expect(env.SYSTEM_VAR).toBe('system_value');
    });

    it('should throw an error if a required variable is missing and errorStrategy is "throw"', () => {
        const schema = z.object({
            REQUIRED_VAR: z.string(),
        });

        expect(() => loadEnv({ schema, errorStrategy: 'throw' })).toThrowError(
            'Environment variable validation error: Required at "REQUIRED_VAR"'
        );
    });

    it('should log an error if a required variable is missing and errorStrategy is "log"', () => {
        const schema = z.object({
            REQUIRED_VAR: z.string(),
        });
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        loadEnv({ schema, errorStrategy: 'log' });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Environment variable validation error: Required at "REQUIRED_VAR"'
        );
        consoleErrorSpy.mockRestore();
    });

    it('should not throw or log an error if a required variable is missing and errorStrategy is "silent"', () => {
        const schema = z.object({
            REQUIRED_VAR: z.string().optional(),
        });

        expect(() => loadEnv({ schema, errorStrategy: 'silent' })).not.toThrow();
    });

    it('should use default values if provided', () => {
        const schema = z.object({
            OPTIONAL_VAR: z.string().default('default_value'),
            NUMBER_VAR: z.coerce.number().default(123),
        });

        const env = loadEnv({ schema, errorStrategy: 'silent' });

        expect(env.OPTIONAL_VAR).toBe('default_value');
        expect(env.NUMBER_VAR).toBe(123);
    });

    it('should validate data types', () => {
        process.env.NUMBER_VAR = '456';
        process.env.BOOLEAN_VAR = 'true';

        const schema = z.object({
            NUMBER_VAR: z.coerce.number(),
            BOOLEAN_VAR: z.coerce.boolean(),
        });

        const env = loadEnv({ schema, errorStrategy: 'silent' });

        expect(env.NUMBER_VAR).toBe(456);
        expect(env.BOOLEAN_VAR).toBe(true);
    });

    it('should throw an error if data type validation fails', () => {
        process.env.NUMBER_VAR = 'not_a_number';

        const schema = z.object({
            NUMBER_VAR: z.coerce.number(),
        });

        expect(() => loadEnv({ schema, errorStrategy: 'throw' })).toThrowError(
            'Environment variable validation error: Expected number, received nan at "NUMBER_VAR"'
        );
    });

    it('should handle array schemas', () => {
        process.env.ARRAY_VAR = 'item1,item2,item3';

        const schema = z.object({
            ARRAY_VAR: z
                .string()
                .transform((val) => val.split(','))
                .pipe(z.array(z.string())),
        });

        const env = loadEnv({ schema, errorStrategy: 'silent' });

        expect(env.ARRAY_VAR).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle enum schemas', () => {
        process.env.ENUM_VAR = 'option2';

        const schema = z.object({
            ENUM_VAR: z.enum(['option1', 'option2', 'option3']),
        });

        const env = loadEnv({ schema, errorStrategy: 'silent' });

        expect(env.ENUM_VAR).toBe('option2');
    });

    it('should throw an error if enum validation fails', () => {
        process.env.ENUM_VAR = 'invalid_option';

        const schema = z.object({
            ENUM_VAR: z.enum(['option1', 'option2', 'option3']),
        });

        expect(() => loadEnv({ schema, errorStrategy: 'throw' })).toThrow(
            'Environment variable validation error: Invalid enum value. Expected \'option1\' | \'option2\' | \'option3\', received \'invalid_option\' at "ENUM_VAR"'
        );
    });
});
