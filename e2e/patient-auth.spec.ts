import { expect, test } from "@playwright/test";
import { Pool } from "pg";

const patient = {
  fullName: "Playwright Patient",
  nic: "200012340999",
  email: "playwright.patient@medsync.test",
  phone: "+94770000999",
  password: "Playwright123!",
};

async function removeTestPatient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to clean up the E2E patient.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<{
      user_id: string;
      address_id: string;
      contact_id: string;
    }>(
      `SELECT user_id, address_id, contact_id
         FROM app_user
        WHERE email = $1`,
      [patient.email],
    );

    for (const user of result.rows) {
      await client.query("DELETE FROM patient WHERE patient_id = $1", [user.user_id]);
      await client.query("DELETE FROM app_user WHERE user_id = $1", [user.user_id]);
      await client.query("DELETE FROM contact_number WHERE contact_id = $1", [user.contact_id]);
      await client.query("DELETE FROM contact WHERE contact_id = $1", [user.contact_id]);
      await client.query("DELETE FROM address WHERE address_id = $1", [user.address_id]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

test.describe("patient authentication workflow", () => {
  test.beforeEach(async () => {
    await removeTestPatient();
  });

  test.afterEach(async () => {
    await removeTestPatient();
  });

  test("a patient registers, signs out, is denied protected access, and signs in again", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Patient Sign Up" }).click();
    await expect(page.getByRole("heading", { name: "MedSync" })).toBeVisible();

    await page.getByLabel("Full name").fill(patient.fullName);
    await page.getByLabel("NIC number").fill(patient.nic);
    await page.getByLabel("Email address").fill(patient.email);
    await page.getByLabel("Phone number").fill(patient.phone);
    await page.getByLabel("Date of birth").fill("2000-01-01");
    await page.getByLabel("Gender").selectOption("Other");
    await page.getByLabel("Address line 1").fill("99 Test Lane");
    await page.getByLabel("Address line 2").fill("");
    await page.getByLabel("City").fill("Colombo");
    await page.getByLabel("Province").fill("Western");
    await page.getByLabel("Postal code").fill("00100");
    await page.getByLabel("Country").fill("Sri Lanka");
    await page.getByLabel("Blood group").selectOption("O+");
    await page.getByLabel("Emergency contact name").fill("Test Contact");
    await page.getByLabel("Phone", { exact: true }).fill("+94770000111");
    await page.getByLabel("Relationship").fill("Sibling");

    const branchSelect = page.getByLabel("Select Branch");
    await expect(branchSelect.locator("option")).not.toHaveCount(1);
    await branchSelect.selectOption({ index: 1 });
    await page.getByLabel("Password", { exact: true }).fill(patient.password);
    await page.getByLabel("Confirm password").fill(patient.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/patient\/dashboard$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Welcome back, Playwright!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/patient/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("Sign in to your account")).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByLabel("Email address").fill(patient.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Unable to log you in", { exact: true })).toBeVisible();

    await page.getByLabel("Password").fill(patient.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/patient\/dashboard$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Welcome back, Playwright!" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
  });
});
