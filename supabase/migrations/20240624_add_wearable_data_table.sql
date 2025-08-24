-- Create wearable_data table
CREATE TABLE IF NOT EXISTS wearable_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL CHECK (device_type IN ('smartwatch', 'fitness_tracker', 'sleep_monitor', 'medical_device', 'other')),
  data_type TEXT NOT NULL CHECK (data_type IN ('heart_rate', 'sleep', 'activity', 'stress', 'blood_pressure', 'blood_glucose', 'other')),
  timestamp TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own data
CREATE POLICY "Users can view their own wearable data"
  ON wearable_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own data
CREATE POLICY "Users can insert their own wearable data"
  ON wearable_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own data
CREATE POLICY "Users can update their own wearable data"
  ON wearable_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own data
CREATE POLICY "Users can delete their own wearable data"
  ON wearable_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy for caregivers to view patient data
CREATE POLICY "Caregivers can view patient wearable data"
  ON wearable_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM caregiver_relationships cr
      WHERE cr.user_id = wearable_data.user_id
      AND cr.caregiver_email = auth.email()
      AND cr.status = 'active'
    )
  );

-- Create index for faster queries
CREATE INDEX wearable_data_user_id_idx ON wearable_data(user_id);
CREATE INDEX wearable_data_timestamp_idx ON wearable_data(timestamp);
CREATE INDEX wearable_data_data_type_idx ON wearable_data(data_type);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON wearable_data
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();