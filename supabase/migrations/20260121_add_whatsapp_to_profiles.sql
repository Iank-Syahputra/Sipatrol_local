-- Add username and phone_number fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE, -- Untuk login
ADD COLUMN IF NOT EXISTS phone_number TEXT;    -- Untuk WA