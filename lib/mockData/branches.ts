export interface Branch {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  managerId: string;
  managerName: string;
  doctorCount: number;
  patientCount: number;
  isActive: boolean;
  createdAt: string;
}

export const branches: Branch[] = [
  {
    branchId: "BR-001",
    name: "MedSync Central",
    address: "1250 Medical Drive, Suite 400",
    city: "San Francisco",
    state: "CA",
    phone: "+1 (415) 555-0101",
    email: "central@medsync.com",
    managerId: "EMP-009",
    managerName: "Sandra Reyes",
    doctorCount: 8,
    patientCount: 320,
    isActive: true,
    createdAt: "2022-01-15",
  },
  {
    branchId: "BR-002",
    name: "MedSync Westside",
    address: "890 Oak Boulevard, Floor 2",
    city: "Oakland",
    state: "CA",
    phone: "+1 (510) 555-0202",
    email: "westside@medsync.com",
    managerId: "EMP-010",
    managerName: "Thomas Wade",
    doctorCount: 6,
    patientCount: 215,
    isActive: true,
    createdAt: "2022-06-01",
  },
  {
    branchId: "BR-003",
    name: "MedSync South Bay",
    address: "3400 Innovation Way",
    city: "San Jose",
    state: "CA",
    phone: "+1 (408) 555-0303",
    email: "southbay@medsync.com",
    managerId: "EMP-011",
    managerName: "Priya Kapoor",
    doctorCount: 5,
    patientCount: 178,
    isActive: true,
    createdAt: "2023-02-10",
  },
];
