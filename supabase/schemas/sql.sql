-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hyperfocus table
CREATE TABLE public.hyperfocus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    color TEXT DEFAULT 'blue' CHECK (color IN ('red','green','blue','orange','purple','brown','gray','pink')),
    estimated_time_minutes INTEGER CHECK (estimated_time_minutes >= 5 AND estimated_time_minutes <= 480),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_hyperfocus_user_id ON public.hyperfocus (user_id);
CREATE INDEX idx_hyperfocus_created_at ON public.hyperfocus (created_at DESC);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_hyperfocus_id ON public.tasks (hyperfocus_id);
CREATE INDEX idx_tasks_order ON public.tasks (hyperfocus_id, order_index);

-- Focus sessions table
CREATE TABLE public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    planned_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER,
    interrupted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_focus_sessions_hyperfocus ON public.focus_sessions (hyperfocus_id);
CREATE INDEX idx_focus_sessions_started ON public.focus_sessions (started_at DESC);

-- Alternancy sessions table
CREATE TABLE public.alternancy_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.alternancy_hyperfocus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alternancy_session_id UUID REFERENCES public.alternancy_sessions(id) ON DELETE CASCADE NOT NULL,
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    UNIQUE(alternancy_session_id, hyperfocus_id, order_index)
);

-- Saved context (widget state)
CREATE TABLE public.hyperfocus_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyperfocus_id UUID REFERENCES public.hyperfocus(id) ON DELETE CASCADE NOT NULL,
    context_data JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Keep only latest context per hyperfocus
    UNIQUE(hyperfocus_id)
);

-- Row Level Security (RLS)
ALTER TABLE public.hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternancy_hyperfocus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hyperfocus_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own hyperfocus"
    ON public.hyperfocus
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD tasks of own hyperfocus"
    ON public.tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.hyperfocus
            WHERE hyperfocus.id = tasks.hyperfocus_id
            AND hyperfocus.user_id = auth.uid()
        )
    );

-- Similar policies para outras tabelas...

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hyperfocus_updated_at
    BEFORE UPDATE ON public.hyperfocus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();