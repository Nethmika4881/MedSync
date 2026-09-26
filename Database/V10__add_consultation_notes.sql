-- Doctor's free-text notes (advice, observations) from the consultation workspace.
ALTER TABLE consultation_record
    ADD COLUMN notes TEXT;

ALTER TABLE consultation_record
    ADD CONSTRAINT chk_consultation_follow_up_date
    CHECK (follow_up_required = FALSE OR follow_up_date IS NOT NULL);
