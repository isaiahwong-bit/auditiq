-- Add care_level to facility_areas for zone-based pre-op check segmentation
ALTER TABLE public.facility_areas
  ADD COLUMN care_level text DEFAULT 'medium'
  CHECK (care_level IN ('high', 'medium', 'low'));
