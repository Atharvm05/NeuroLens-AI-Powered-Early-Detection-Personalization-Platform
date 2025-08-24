-- NeuroLens Core Database Schema
-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT[],
  medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health metrics table
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'cognitive_score', 'mood_rating', 'sleep_quality', 'stress_level'
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'manual' -- 'manual', 'ai_detection', 'sensor'
);

-- Create AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  sentiment_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create detection results table
CREATE TABLE IF NOT EXISTS public.detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detection_type TEXT NOT NULL, -- 'speech', 'facial', 'behavioral'
  confidence_score NUMERIC NOT NULL,
  risk_indicators JSONB,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create caregiver relationships table
CREATE TABLE IF NOT EXISTS public.caregiver_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'family', 'professional', 'friend'
  permissions TEXT[] DEFAULT ARRAY['view_metrics'], -- 'view_metrics', 'receive_alerts', 'manage_plans'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, caregiver_id)
);

-- Create wellness plans table
CREATE TABLE IF NOT EXISTS public.wellness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activities JSONB NOT NULL, -- Array of activity objects
  schedule JSONB, -- Schedule configuration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create RLS policies for health_metrics
CREATE POLICY "health_metrics_select_own" ON public.health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "health_metrics_insert_own" ON public.health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "health_metrics_update_own" ON public.health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "health_metrics_delete_own" ON public.health_metrics FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for ai_conversations
CREATE POLICY "ai_conversations_select_own" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_conversations_update_own" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ai_conversations_delete_own" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for detection_results
CREATE POLICY "detection_results_select_own" ON public.detection_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "detection_results_insert_own" ON public.detection_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "detection_results_update_own" ON public.detection_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "detection_results_delete_own" ON public.detection_results FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for caregiver_relationships
CREATE POLICY "caregiver_relationships_select_own" ON public.caregiver_relationships 
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = caregiver_id);
CREATE POLICY "caregiver_relationships_insert_patient" ON public.caregiver_relationships 
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "caregiver_relationships_update_patient" ON public.caregiver_relationships 
  FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "caregiver_relationships_delete_patient" ON public.caregiver_relationships 
  FOR DELETE USING (auth.uid() = patient_id);

-- Create RLS policies for wellness_plans
CREATE POLICY "wellness_plans_select_own" ON public.wellness_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wellness_plans_insert_own" ON public.wellness_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wellness_plans_update_own" ON public.wellness_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wellness_plans_delete_own" ON public.wellness_plans FOR DELETE USING (auth.uid() = user_id);
