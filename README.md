# tenv

A TypeScript library for loading and validating environment variables using Zod schemas.

## Installation

```bash
npm install @aevum/tenv
```

## Features

- Type-safe environment variable loading
- Zod schema validation
- Flexible error handling strategies
- .env file support
- Process.env fallback

## Usage

```typescript
import { loadEnv } from '@aevum/tenv';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().transform(Number),
  API_KEY: z.string(),
  DEBUG: z.string().transform(val => val === 'true'),
  ALLOWED_ORIGINS: z.string().transform(val => val.split(','))
});

const env = loadEnv({
  schema: envSchema,
  dotEnvPath: '.env',
  errorStrategy: 'throw'
});

console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
```

## Configuration Options

```typescript
type LoadEnvOptions<T extends z.ZodTypeAny> = {
    schema: T;
    dotEnvPath?: string;
    errorStrategy?: 'throw' | 'log' | 'silent';
};
```

## Error Handling

Three strategies available:
- `throw`: Throws an error (default)
- `log`: Logs errors to console
- `silent`: Continues silently

```typescript
loadEnv({
  schema: envSchema,
  errorStrategy: 'throw' | 'log' | 'silent'
});
```

## Type Safety

Full TypeScript support with Zod schema inference:

```typescript
const envSchema = z.object({
  PORT: z.number()
});

const env = loadEnv({ schema: envSchema });
env.PORT // TypeScript knows this is a number
```

## License

MIT