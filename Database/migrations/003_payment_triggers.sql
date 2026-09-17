-- Migration: 003_payment_triggers.sql
-- Automatic balance recalculation, zero-balance validation, and status updates for invoices upon payment collection.

-- ─── 1. Payment Trigger Function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_process_payment_and_update_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_amount    DECIMAL(10,2);
  v_paid_amount     DECIMAL(10,2);
  v_balance_due     DECIMAL(10,2);
  v_new_status      VARCHAR(20);
BEGIN
  -- Read current invoice totals
  SELECT total_amount, paid_amount, balance_due
    INTO v_total_amount, v_paid_amount, v_balance_due
    FROM invoice
   WHERE invoice_id = NEW.invoice_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND: Invoice % does not exist', NEW.invoice_id;
  END IF;

  -- SAFE-5 & BR-7 Guard: Reject payments greater than current balance due
  IF NEW.amount > v_balance_due THEN
    RAISE EXCEPTION 'OVERPAYMENT_REJECTED: Payment amount (%) exceeds remaining balance due (%)',
      NEW.amount, v_balance_due;
  END IF;

  -- Calculate new cumulative totals
  v_paid_amount := v_paid_amount + NEW.amount;
  v_balance_due := GREATEST(0, v_total_amount - v_paid_amount);

  -- Determine new invoice status
  IF v_balance_due <= 0 THEN
    v_new_status := 'Paid';
  ELSIF v_paid_amount > 0 THEN
    v_new_status := 'Partial';
  ELSE
    v_new_status := 'Unpaid';
  END IF;

  -- Update invoice master record
  UPDATE invoice
     SET paid_amount   = v_paid_amount,
         balance_due   = v_balance_due,
         status        = v_new_status,
         paid_at       = CASE WHEN v_balance_due <= 0 THEN NOW() ELSE paid_at END,
         updated_at    = NOW()
   WHERE invoice_id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2. Attach Trigger ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_payment_update_invoice ON payment;
CREATE TRIGGER trg_payment_update_invoice
  AFTER INSERT ON payment
  FOR EACH ROW
  EXECUTE FUNCTION fn_process_payment_and_update_balance();
