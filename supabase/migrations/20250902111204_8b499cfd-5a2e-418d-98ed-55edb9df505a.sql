-- Update the existing user to be admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'renan.mirandola@outlook.com';