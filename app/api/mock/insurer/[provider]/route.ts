import { NextRequest, NextResponse } from "next/server";

// Mock insurance companies
const PROVIDER_CATALOGS: Record<string, any[]> = {
  Allianz: [
    {
      packageName: "Allianz Comprehensive Health",
      annualLimit: 1500000.0,
      copaymentPercentage: 10.0,
      description: "Full in-patient and surgical coverage with 10% co-payment.",
    },
    {
      packageName: "Allianz Executive Outpatient Care",
      annualLimit: 350000.0,
      copaymentPercentage: 15.0,
      description: "Consultation, lab investigations, and prescription medicine.",
    },
    {
      packageName: "Allianz Senior Citizen Shield",
      annualLimit: 800000.0,
      copaymentPercentage: 20.0,
      description: "Specialized geriatric and chronic care coverage.",
    },
  ],
  AIA: [
    {
      packageName: "AIA Health Premier Plus",
      annualLimit: 2000000.0,
      copaymentPercentage: 5.0,
      description: "Premium hospital room entitlement and zero deductible surgical benefits.",
    },
    {
      packageName: "AIA Critical Illness Protector",
      annualLimit: 1200000.0,
      copaymentPercentage: 0.0,
      description: "100% cover for 37 major illnesses and specialist interventions.",
    },
  ],
  "Ceylinco Life": [
    {
      packageName: "Ceylinco Suwa Sampatha",
      annualLimit: 1000000.0,
      copaymentPercentage: 10.0,
      description: "Hospitalization, ICU stays, and minor daycare treatments.",
    },
    {
      packageName: "Ceylinco Family Care Plan",
      annualLimit: 750000.0,
      copaymentPercentage: 12.5,
      description: "Shared family package covering up to 4 members.",
    },
  ],
  "Sri Lanka Insurance": [
    {
      packageName: "SLIC Medi-Care Gold",
      annualLimit: 900000.0,
      copaymentPercentage: 10.0,
      description: "Government and private hospital room recovery benefits.",
    },
  ],
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  const decodedProvider = decodeURIComponent(provider);

  const packages = PROVIDER_CATALOGS[decodedProvider];

  if (!packages) {
    return NextResponse.json({
      provider: decodedProvider,
      packages: [
        {
          packageName: `${decodedProvider} Standard Care`,
          annualLimit: 500000.0,
          copaymentPercentage: 15.0,
          description: `Standard baseline medical care package provided by ${decodedProvider}.`,
        },
      ],
      syncedAt: new Date().toISOString(),
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 250));

  return NextResponse.json({
    provider: decodedProvider,
    packages,
    syncedAt: new Date().toISOString(),
  });
}