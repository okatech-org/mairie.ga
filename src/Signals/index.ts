/**
 * 📡 SIGNALS - Data Transfer Objects
 * 
 * Immutable objects for input/output between layers.
 * No logic, pure data structures.
 * 
 * Naming: [Domain][Direction]Signal.ts
 * Examples:
 * - AuthRequestSignal.ts (input)
 * - AuthResultSignal.ts (output)
 * - CreateUserSignal.ts
 */

export * from './auth.signals';
export * from './profile.signals';
export * from './request.signals';
