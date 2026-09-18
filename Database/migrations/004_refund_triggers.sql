-- Migration: 004_refund_triggers.sql
-- Overpaid invoice detection, credit balance tracking, and automated refund task generation for REQ-32.

-- ─── 1. Add credit_balance column to invoice ─────────────────────────────────

ALTER TABLE invoice
  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00;

-- ─── 2. Create refund_task table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refund_task (
  task_id        VARCHAR(20) PRIMARY KEY,
  invoice_id     VARCHAR(20) NOT NULL REFERENCES invoice(invoice_id) ON DELETE CASCADE,
  patient_id     VARCHAR(20) NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
  refund_amount  DECIMAL(10,2) NOT NULL,
  reason         VARCHAR(255) NOT NULL DEFAULT 'Insurance Overpayment Refund',
  status         VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Processed' | 'Dismissed'
  processed_by   VARCHAR(20),
  processed_at   TIMESTAMP,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─── 3. Trigger Function for Insurance Overpayment ───────────────────────────

CREATE OR REPLACE FUNCTION fn_detect_claim_overpayment()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_id      VARCHAR(20);
  v_total_amount    DECIMAL(10,2);
  v_paid_amount     DECIMAL(10,2);
  v_total_credits   DECIMAL(10,2);
  v_overpaid_amount DECIMAL(10,2);
  v_task_id         VARCHAR(20);
BEGIN
  -- Only process when claim status changes to 'Approved' or 'Settled'
  IF NEW.status NOT IN ('Approved', 'Settled') THEN
    RETURN NEW;
  END IF;

  -- Read invoice totals and patient_id
  SELECT patient_id, total_amount, paid_amount
    INTO v_patient_id, v_total_amount, v_paid_amount
    FROM invoice
   WHERE invoice_id = NEW.invoice_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate total credits (patient paid + insurance approved)
  v_total_credits := v_paid_amount + NEW.approved_amount;

  -- Detect overpayment condition
  IF v_total_credits > v_total_amount THEN
    v_overpaid_amount := v_total_credits - v_total_amount;

    -- 1. Flag invoice as Overpaid & record credit_balance
    UPDATE invoice
       SET status         = 'Overpaid',
           credit_balance = v_overpaid_amount,
           updated_at     = NOW()
     WHERE invoice_id = NEW.invoice_id;

    -- 2. Insert automated refund task if not already created
    v_task_id := 'TSK-REF-' || LEFT(md5(NEW.invoice_id || '|' || NOW()::TEXT), 8);

    INSERT INTO refund_task (task_id, invoice_id, patient_id, refund_amount, reason, status, created_at)
    VALUES (
      v_task_id,
      NEW.invoice_id,
      v_patient_id,
      v_overpaid_amount,
      'Insurance Claim Overpayment (Claim ' || NEW.claim_id || ')',
      'Pending',
      NOW()
    )
    ON CONFLICT (task_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 4. Attach Trigger ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_claim_overpayment_guard ON claim;
CREATE TRIGGER trg_claim_overpayment_guard
  AFTER INSERT OR UPDATE ON claim
  FOR EACH ROW
  EXECUTE FUNCTION fn_detect_claim_overpayment();
