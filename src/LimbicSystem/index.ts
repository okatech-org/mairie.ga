/**
 * 🧬 LIMBIC SYSTEM - Infrastructure Layer
 * 
 * Implements Cortex Ports. Contains all technical adapters.
 * This is where Supabase, external APIs, and storage live.
 * 
 * Structure:
 * - /supabase   → Supabase adapters (implements IRepositories)
 * - /storage    → File storage adapters
 * - /external   → Third-party API integrations
 */

export * from './supabase';
// export * from './storage';
// export * from './external';
