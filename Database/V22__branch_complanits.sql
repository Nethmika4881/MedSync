CREATE TABLE branch_complaint (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branch(branch_id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patient(patient_id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_branch_complaint_branch ON branch_complaint(branch_id);
CREATE INDEX idx_branch_complaint_status ON branch_complaint(status);