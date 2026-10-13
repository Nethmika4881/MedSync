CREATE TABLE IF NOT EXISTS doctor_notification_read (
    doctor_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
    notification_id TEXT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doctor_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_notification_read_doctor
    ON doctor_notification_read (doctor_id, read_at DESC);
