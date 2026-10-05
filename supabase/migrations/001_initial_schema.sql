-- StudyForge initial schema

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete set null,
  anon_token      text,
  university_name text not null,
  course_name     text not null,
  course_code     text,
  status          text not null default 'pending'
                    check (status in ('pending','parsing','searching','generating','complete','error')),
  error_message   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists public.uploads (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  file_name       text not null,
  file_type       text not null check (file_type in ('pdf','pptx','ppt','docx')),
  file_size_bytes integer not null,
  storage_path    text not null,
  parse_status    text not null default 'pending'
                    check (parse_status in ('pending','parsed','failed')),
  page_count      integer,
  created_at      timestamptz default now()
);

create table if not exists public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  upload_id   uuid not null references public.uploads(id) on delete cascade,
  chunk_index integer not null,
  chunk_type  text not null check (chunk_type in ('page','slide')),
  content     text not null,
  char_count  integer generated always as (length(content)) stored,
  metadata    jsonb default '{}',
  created_at  timestamptz default now(),
  unique (upload_id, chunk_index)
);

create table if not exists public.web_search_results (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  query       text not null,
  provider    text not null check (provider in ('tavily','brave','none')),
  results     jsonb not null default '[]',
  created_at  timestamptz default now()
);

create table if not exists public.generated_notes (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.sessions(id) on delete cascade,
  model_used          text not null,
  sections            jsonb not null default '[]',
  summary             text,
  key_concepts        jsonb default '[]',
  prompt_tokens       integer,
  completion_tokens   integer,
  generation_time_ms  integer,
  created_at          timestamptz default now()
);

create table if not exists public.expected_questions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('short_answer','essay','calculation')),
  topic_tag     text,
  difficulty    text check (difficulty in ('easy','medium','hard')),
  model_answer  text,
  source_hint   text check (source_hint in ('from_slides','from_past_paper','web_context')),
  created_at    timestamptz default now()
);

create table if not exists public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.sessions(id) on delete cascade,
  title           text not null,
  total_questions integer not null,
  created_at      timestamptz default now()
);

create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes(id) on delete cascade,
  question_index  integer not null,
  question_type   text not null check (question_type in ('mcq','short_answer')),
  question_text   text not null,
  options         jsonb,
  correct_answer  text not null,
  explanation     text,
  topic_tag       text,
  created_at      timestamptz default now()
);

create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  user_id      uuid references public.users(id) on delete set null,
  answers      jsonb not null default '{}',
  score        integer,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

-- Storage bucket (run via Supabase dashboard or CLI)
-- insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false);
