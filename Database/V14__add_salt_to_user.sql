ALTER TABLE app_user ADD COLUMN salt VARCHAR(255);

-- Set the salt and correct password hash for the default admin user
UPDATE app_user
SET
    salt = 'TPXYuE4bXTpZsWl9XZOU',
    password_hash = '1d4e383b62364282555dccae91e0e5b86601efe104f4fa1459933a0abf540a35744593ad4385c5446e3544cfd45a8d178d4b97e72a6e72593f440d6b375eca33'
WHERE email = 'admin@medsync.com';
