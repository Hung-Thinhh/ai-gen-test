/**
 * Application-wide constants
 */

// Automatically detect the site URL
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// API endpoints
export const API_BASE_URL = '/api';

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

// App metadata
export const APP_NAME = 'Duky AI';
export const APP_DESCRIPTION = 'AI-powered image generation platform';

// Default values
export const DEFAULT_CREDITS = 5;
export const DEFAULT_USER_ROLE = 'user';
