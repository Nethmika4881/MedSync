CREATE TABLE IF NOT EXISTS branch_treatment (
    branch_id UUID NOT NULL REFERENCES branch(branch_id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES treatment_catalogue(treatment_id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (branch_id, treatment_id)
);

CREATE INDEX idx_branch_treatment_branch ON branch_treatment(branch_id);