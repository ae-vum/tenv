# tenv

A TypeScript library for loading and validating environment variables with schema support.

## Installation

```bash
npm install @aevum/tenv
```

## Features

- Type-safe environment variable loading
- Schema validation
- Default values
- Required fields
- Allowed values validation
- Regex pattern validation
- Custom validation functions
- Array support
- Sensitive data handling
- Flexible error handling strategies

## Usage

```typescript
import { loadEnv } from '@aevum/tenv';

const env = loadEnv({
  schema: {
    PORT: {
      type: 'number',
      required: true,
      default: 3000
    },
    API_KEY: {
      type: 'string',
      required: true,
      sensitive: true
    },
    DEBUG: {
      type: 'boolean',
      default: false
    },
    ALLOWED_ORIGINS: {
      type: 'array',
      items: 'string',
      default: ['http://localhost:3000']
    }
  },
  dotEnvPath: '.env',
  errorStrategy: 'throw'
});

console.log(env.PORT); // number
console.log(env.API_KEY); // string
console.log(env.DEBUG); // boolean
console.log(env.ALLOWED_ORIGINS); // string[]
```

## Schema Options

### Basic Types
- `string`
- `number`
- `boolean`
- `array`

### Configuration Options

```typescript
{
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: any;
  allowedValues?: any[];
  regex?: RegExp;
  validation?: (value: any) => boolean;
  sensitive?: boolean;
}
```

### Array Configuration

```typescript
{
  type: 'array';
  items: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any[];
  validation?: (value: any[]) => boolean;
  sensitive?: boolean;
}
```

## Error Handling

Three strategies available:
- `throw`: Throws an error (default)
- `log`: Logs warnings to console
- `default`: Silently continues with defaults

```typescript
loadEnv({
  schema: {...},
  errorStrategy: 'throw' | 'log' | 'default'
});
```

## Type Safety

The library provides full TypeScript support with inferred types based on your schema:

```typescript
const env = loadEnv({
  schema: {
    PORT: { type: 'number' }
  }
});

env.PORT // TypeScript knows this is a number
```

## License

MIT