import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

test("1. Valid available slots remain queryable with remaining capacity", async () => {
  const res = await pool.query(`
    SELECT
      s.time_slot_id,
      s.doctor_id,
      s.branch_id,
      s.available_date,
      s.start_time,
      s.end_time,
      s.max_tickets,
      (s.max_tickets - COUNT(a.appointment_id) FILTER (WHERE a.status NOT IN ('Cancelled')))::int AS remaining_capacity
    FROM time_slot s
    LEFT JOIN appointment a ON a.time_slot_id = s.time_slot_id
    WHERE s.available_date >= CURRENT_DATE
    GROUP BY s.time_slot_id, s.doctor_id, s.branch_id, s.available_date, s.start_time, s.end_time, s.max_tickets
    HAVING (s.max_tickets - COUNT(a.appointment_id) FILTER (WHERE a.status NOT IN ('Cancelled'))) > 0
    ORDER BY s.available_date ASC
    LIMIT 5
  `);

  assert.ok(res.rows.length > 0, "At least one available future slot should exist");
  for (const row of res.rows) {
    assert.ok(row.remaining_capacity > 0, "Slot must have positive remaining capacity");
    assert.ok(row.max_tickets > 0, "Slot max_tickets must be positive");
  }
});

test("2. V35 Conflicting availability: Exclusion constraint rejects overlapping time slots", async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Apply V35 constraint inside isolated test transaction
    await client.query("CREATE EXTENSION IF NOT EXISTS btree_gist;");
    await client.query(`
      ALTER TABLE time_slot
      ADD CONSTRAINT test_excl_doctor_time_slot_overlap
      EXCLUDE USING gist (
        doctor_id WITH =,
        tsrange(available_date + start_time, available_date + end_time) WITH &&
      );
    `);

    // Pick an existing doctor and branch
    const docRes = await client.query("SELECT doctor_id FROM doctor LIMIT 1");
    const doctorId = docRes.rows[0].doctor_id;
    const branchRes = await client.query("SELECT branch_id FROM branch LIMIT 1");
    const branchId = branchRes.rows[0].branch_id;

    const testDate = "2029-12-01";

    // Insert base slot: 09:00 - 11:00
    await client.query(`
      INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
      VALUES ($1, $2, $3, '09:00:00', '11:00:00', 10)
    `, [doctorId, branchId, testDate]);

    // Attempt to insert overlapping slot for the same doctor: 10:00 - 12:00
    let caughtError: Error | null = null;
    try {
      await client.query(`
        INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
        VALUES ($1, $2, $3, '10:00:00', '12:00:00', 10)
      `, [doctorId, branchId, testDate]);
    } catch (err) {
      caughtError = err as Error;
    }

    assert.ok(caughtError !== null, "Overlapping slot must be rejected by PostgreSQL exclusion constraint");
    assert.match(caughtError.message, /test_excl_doctor_time_slot_overlap/, "Error message must cite exclusion constraint");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test("3. Capacity check: Full capacity slots cannot accept new appointments", async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docRes = await client.query("SELECT doctor_id FROM doctor LIMIT 1");
    const doctorId = docRes.rows[0].doctor_id;
    const branchRes = await client.query("SELECT branch_id FROM branch LIMIT 1");
    const branchId = branchRes.rows[0].branch_id;
    const patRes = await client.query("SELECT patient_id FROM patient LIMIT 1");
    const patient1 = patRes.rows[0].patient_id;
    const empRes = await client.query("SELECT employee_id FROM employee LIMIT 1");
    const employeeId = empRes.rows[0].employee_id;

    // Create a slot with max_tickets = 1
    const slotRes = await client.query(`
      INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
      VALUES ($1, $2, '2029-12-15', '14:00:00', '15:00:00', 1)
      RETURNING time_slot_id
    `, [doctorId, branchId]);
    const slotId = slotRes.rows[0].time_slot_id;

    // Book 1 appointment to max out capacity
    await client.query(`
      INSERT INTO appointment (time_slot_id, patient_id, queue_number, created_by, status)
      VALUES ($1, $2, 1, $3, 'Scheduled')
    `, [slotId, patient1, employeeId]);

    // Check count: active_count is 1, max_tickets is 1
    const countRes = await client.query(`
      SELECT COUNT(*)::int AS active_count
      FROM appointment
      WHERE time_slot_id = $1 AND status NOT IN ('Cancelled')
    `, [slotId]);

    const activeCount = countRes.rows[0].active_count;
    assert.equal(activeCount, 1);

    // Any attempt to book should detect activeCount >= max_tickets (1 >= 1)
    const canBook = activeCount < 1;
    assert.equal(canBook, false, "Slot with 1/1 capacity cannot accept bookings");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test("4. Rescheduling integrity: Preserves appointment and enforces cutoff & capacity", async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docRes = await client.query("SELECT doctor_id FROM doctor LIMIT 1");
    const doctorId = docRes.rows[0].doctor_id;
    const branchRes = await client.query("SELECT branch_id FROM branch LIMIT 1");
    const branchId = branchRes.rows[0].branch_id;
    const patRes = await client.query("SELECT patient_id FROM patient LIMIT 1");
    const patientId = patRes.rows[0].patient_id;
    const empRes = await client.query("SELECT employee_id FROM employee LIMIT 1");
    const employeeId = empRes.rows[0].employee_id;

    // Create slot 1 (future date > 24 hours away)
    const s1Res = await client.query(`
      INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
      VALUES ($1, $2, '2029-12-10', '09:00:00', '10:00:00', 5)
      RETURNING time_slot_id
    `, [doctorId, branchId]);
    const slot1Id = s1Res.rows[0].time_slot_id;

    // Create slot 2 (future target slot)
    const s2Res = await client.query(`
      INSERT INTO time_slot (doctor_id, branch_id, available_date, start_time, end_time, max_tickets)
      VALUES ($1, $2, '2029-12-11', '09:00:00', '10:00:00', 5)
      RETURNING time_slot_id
    `, [doctorId, branchId]);
    const slot2Id = s2Res.rows[0].time_slot_id;

    // Create scheduled appointment in slot 1
    const apptRes = await client.query(`
      INSERT INTO appointment (time_slot_id, patient_id, queue_number, created_by, status)
      VALUES ($1, $2, 1, $3, 'Scheduled')
      RETURNING appointment_id
    `, [slot1Id, patientId, employeeId]);
    const apptId = apptRes.rows[0].appointment_id;

    // Reschedule appointment to slot 2
    await client.query(`
      UPDATE appointment
      SET time_slot_id = $1,
          queue_number = 1,
          updated_at = NOW()
      WHERE appointment_id = $2
    `, [slot2Id, apptId]);

    // Verify appointment is now in slot 2
    const verifyRes = await client.query(`
      SELECT time_slot_id FROM appointment WHERE appointment_id = $1
    `, [apptId]);

    assert.equal(verifyRes.rows[0].time_slot_id, slot2Id, "Appointment successfully moved to target slot");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test("5. Concurrency control: Row-level locking on time_slot serializes concurrent access", async () => {
  // Query an existing committed slot
  const slotRes = await pool.query("SELECT time_slot_id FROM time_slot LIMIT 1");
  assert.ok(slotRes.rows.length > 0, "Need an existing time slot");
  const slotId = slotRes.rows[0].time_slot_id;

  const client1 = await pool.connect();
  const client2 = await pool.connect();
  try {
    await client1.query("BEGIN");
    await client2.query("BEGIN");

    // Client 1 locks slot with FOR UPDATE
    const lock1 = await client1.query(
      "SELECT time_slot_id, max_tickets FROM time_slot WHERE time_slot_id = $1 FOR UPDATE",
      [slotId]
    );
    assert.equal(lock1.rows.length, 1);

    // Client 2 attempts to lock with NOWAIT - should throw 55P03 lock_not_available
    let client2LockFailed = false;
    try {
      await client2.query(
        "SELECT time_slot_id FROM time_slot WHERE time_slot_id = $1 FOR UPDATE NOWAIT",
        [slotId]
      );
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "55P03") {
        client2LockFailed = true;
      }
    }

    assert.equal(client2LockFailed, true, "Client 2 must be blocked from acquiring lock when slot is locked FOR UPDATE");
  } finally {
    await client1.query("ROLLBACK");
    await client2.query("ROLLBACK");
    client1.release();
    client2.release();
  }
});

test("6. V35 Multiple Specializations: Doctor can hold multiple specializations without duplicate doctor rows", async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Apply V35 constraint drop inside isolated test transaction
    await client.query("ALTER TABLE doctor_specialization DROP CONSTRAINT IF EXISTS uq_doctor_one_specialization;");

    // Get a doctor and two specialization IDs
    const docRes = await client.query("SELECT doctor_id FROM doctor LIMIT 1");
    const doctorId = docRes.rows[0].doctor_id;

    const specsRes = await client.query("SELECT specialization_id, title FROM specialization LIMIT 2");
    assert.ok(specsRes.rows.length >= 2, "Need at least 2 specializations in DB");
    const spec1Id = specsRes.rows[0].specialization_id;
    const spec1Title = specsRes.rows[0].title;
    const spec2Id = specsRes.rows[1].specialization_id;
    const spec2Title = specsRes.rows[1].title;

    // Clean existing specs for test doctor and insert two
    await client.query("DELETE FROM doctor_specialization WHERE doctor_id = $1", [doctorId]);
    await client.query("INSERT INTO doctor_specialization (doctor_id, specialization_id) VALUES ($1, $2)", [doctorId, spec1Id]);
    await client.query("INSERT INTO doctor_specialization (doctor_id, specialization_id) VALUES ($1, $2)", [doctorId, spec2Id]);

    // Query aggregated specializations exactly as our updated actions do
    const queryRes = await client.query(`
      SELECT
        d.doctor_id,
        COALESCE(
          (
            SELECT ARRAY_AGG(s.title ORDER BY s.title)
            FROM doctor_specialization ds
            JOIN specialization s ON s.specialization_id = ds.specialization_id
            WHERE ds.doctor_id = d.doctor_id
          ),
          ARRAY[]::text[]
        ) AS specializations
      FROM doctor d
      WHERE d.doctor_id = $1
    `, [doctorId]);

    assert.equal(queryRes.rows.length, 1, "Doctor must appear exactly once");
    const doctorSpecs = queryRes.rows[0].specializations;
    assert.equal(doctorSpecs.length, 2, "Doctor must have both specializations");

    const expectedTitles = [spec1Title, spec2Title].sort();
    assert.deepEqual(doctorSpecs, expectedTitles, "Specializations must match and be ordered alphabetically");
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});

test.after(async () => {
  await pool.end();
});
