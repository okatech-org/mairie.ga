-- Fix search_path for generate_icorr_reference function
CREATE OR REPLACE FUNCTION generate_icorr_reference()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.reference_number := 'CORR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM() * 100000) AS TEXT), 5, '0');
    RETURN NEW;
END;
$$;