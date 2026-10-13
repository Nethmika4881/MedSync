import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { createClient } from "redis";
import { randomBytes } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;

test.skip(!databaseUrl || !redisUrl, "DATABASE_URL and REDIS_URL are required");

const pool = new Pool({ connectionString: databaseUrl });
const redis = createClient({ url: redisUrl });
const marker = `admin_route_test_${Date.now()}`;
const nicPrefix = Date.now().toString().slice(-10);
const sessionId = randomBytes(32).toString("hex");

let mainBranchId = "";
let transferBranchId = "";
let testEmployeeIds: string[] = [];

test.beforeAll(async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const mainBranch = await client.query<{
      branch_id: string;
      address_id: string;
      contact_id: string;
      manager_id: string;
    }>(
      `SELECT branch_id, address_id, contact_id, manager_id
       FROM branch
       WHERE is_active = TRUE AND manager_id IS NOT NULL
       ORDER BY created_at
       LIMIT 1`,
    );

    if (mainBranch.rowCount !== 1) {
      throw new Error("The test database needs one active managed branch");
    }

    const source = mainBranch.rows[0];
    mainBranchId = source.branch_id;

    const transferBranch = await client.query<{ branch_id: string }>(
      `INSERT INTO branch (
         branch_name, address_id, contact_id, is_active
       ) VALUES ($1, $2, $3, FALSE)
       RETURNING branch_id`,
      [`Transfer Test Branch ${marker}`, source.address_id, source.contact_id],
    );
    transferBranchId = transferBranch.rows[0].branch_id;

    const users = await client.query<{ user_id: string }>(
      `INSERT INTO app_user (
         address_id, contact_id, user_type, full_name, nic, email,
         gender, dob, password_hash, salt
       )
       SELECT
         $1,
         $2,
         'Employee',
         'Transfer Candidate ' || LPAD(item::text, 2, '0'),
         $3 || LPAD(item::text, 2, '0'),
         $4 || item || '@medsync.test',
         'Other',
         DATE '1990-01-01',
         'test_hash',
         'test_salt'
       FROM generate_series(1, 21) AS item
       RETURNING user_id`,
      [source.address_id, source.contact_id, nicPrefix, marker],
    );
    testEmployeeIds = users.rows.map((row) => row.user_id);

    await client.query(
      `INSERT INTO employee (employee_id, branch_id, role, joined_date)
       SELECT UNNEST($1::uuid[]), $2, 'FrontDesk', CURRENT_DATE`,
      [testEmployeeIds, transferBranchId],
    );

    await client.query("COMMIT");

    await redis.connect();
    await redis.set(
      `session_id:${sessionId}`,
      JSON.stringify({ id: source.manager_id, role: "Admin" }),
      { EX: 3600 },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "session_id",
      value: sessionId,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
    {
      name: "session_role",
      value: "Admin",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
});

test.afterAll(async () => {
  if (redis.isOpen) {
    await redis.del(`session_id:${sessionId}`);
    await redis.quit();
  }

  if (testEmployeeIds.length > 0) {
    await pool.query(`DELETE FROM employee WHERE employee_id = ANY($1::uuid[])`, [
      testEmployeeIds,
    ]);
    await pool.query(`DELETE FROM app_user WHERE user_id = ANY($1::uuid[])`, [
      testEmployeeIds,
    ]);
  }

  if (transferBranchId) {
    await pool.query(`DELETE FROM branch WHERE branch_id = $1`, [transferBranchId]);
  }

  await pool.end();
});

test("redirects an unauthenticated visitor away from the staff directory", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/admin/staff");

  await expect(page).toHaveURL(/\/login$/);
  await context.close();
});

test("paginates the complete staff directory", async ({ page }) => {
  await page.goto("/admin/staff?status=active");

  await expect(
    page.getByRole("heading", { name: "Staff Management" }),
  ).toBeVisible();
  await expect(page.getByText(/Showing 1 to 20 of \d+ staff members/)).toBeVisible();

  const nextButton = page.getByRole("button", { name: "Next", exact: true });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText(/Page 2 of \d+/)).toBeVisible();
});

test("transfers an available staff member from another branch", async ({ page }) => {
  await page.goto(`/admin/branches/${mainBranchId}`);

  await page.getByRole("button", { name: /Staff Directory/ }).click();
  await page.getByRole("button", { name: "Transfer Staff" }).click();
  await page
    .getByPlaceholder("Search staff at other branches...")
    .fill("Transfer Candidate 01");

  await expect(page.getByText("Transfer Candidate 01 (FrontDesk)")).toBeVisible();
  await expect(
    page.getByText(`Current branch: Transfer Test Branch ${marker}`),
  ).toBeVisible();

  await page.getByText("Transfer Candidate 01 (FrontDesk)").click();
  await page
    .getByRole("button", { name: "Transfer Staff", exact: true })
    .last()
    .click();

  await expect(page.getByText("Transfer Candidate 01", { exact: true })).toBeVisible();

  const transferred = await pool.query<{ branch_id: string }>(
    `SELECT branch_id FROM employee WHERE employee_id = $1`,
    [testEmployeeIds[0]],
  );
  expect(transferred.rows[0].branch_id).toBe(mainBranchId);
});
