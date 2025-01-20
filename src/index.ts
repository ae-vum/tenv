import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { z } from 'zod';

type EnvSchema = z.ZodTypeAny;

type LoadEnvOptions<T extends EnvSchema> = {
    schema: T;
    dotEnvPath?: string;
    errorStrategy?: 'throw' | 'log' | 'silent';
};

function loadEnv<T extends EnvSchema>(options: LoadEnvOptions<T>): z.infer<T> {
    const { schema, dotEnvPath = '.env', errorStrategy = 'throw' } = options;

    const envVars = { ...process.env };

    if (fs.existsSync(dotEnvPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(dotEnvPath));
        for (const k in envConfig) {
            if (!process.env[k]) {
                envVars[k] = envConfig[k];
            }
        }
    }

    const parsed = schema.safeParse(envVars);

    if (!parsed.success) {
        const errors = parsed.error.errors.map(
            (e) => `Environment variable validation error: ${e.message} at "${e.path.join('.')}"`
        );

        if (errorStrategy === 'throw') {
            throw new Error(errors.join('\n'));
        } else if (errorStrategy === 'log') {
            console.error(errors.join('\n'));
        }

        return {} as z.infer<T>;
    }

    return parsed.success ? parsed.data : ({} as z.infer<T>);
}

export { loadEnv };
