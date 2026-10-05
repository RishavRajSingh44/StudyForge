import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OLLAMA_MODEL: z.string().optional(),
    OLLAMA_FALLBACK_MODEL: z.string().optional(),
    OLLAMA_BASE_URL: z.string().url().optional(),
    AI_API_KEY: z.string().optional(),
    AI_BASE_URL: z.string().url().optional(),
    AI_MODEL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    BRAVE_SEARCH_API_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    OLLAMA_FALLBACK_MODEL: process.env.OLLAMA_FALLBACK_MODEL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_MODEL: process.env.AI_MODEL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
