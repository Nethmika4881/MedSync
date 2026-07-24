export interface Employee {
  employeeId: string;
  name: string;
  role: string;
  branchId: string;
  branchName: string;
  email: string;
  phone: string;
  avatar: string;
  hireDate: string;
  isActive: boolean;
  department: string;
}

export const employees: Employee[] = [
  { employeeId: "EMP-001", name: "Jessica Turner", role: "Receptionist", branchId: "BR-001", branchName: "Healthora Central", email: "jessica.turner@healthora.com", phone: "+1 (415) 555-3001", avatar: "JT", hireDate: "2022-03-01", isActive: true, department: "Front Desk" },
  { employeeId: "EMP-002", name: "Michael Okafor", role: "Nurse", branchId: "BR-002", branchName: "Healthora Westside", email: "michael.okafor@healthora.com", phone: "+1 (510) 555-3002", avatar: "MO", hireDate: "2021-08-15", isActive: true, department: "Clinical" },
  { employeeId: "EMP-003", name: "Lisa Nguyen", role: "Pharmacist", branchId: "BR-001", branchName: "Healthora Central", email: "lisa.nguyen@healthora.com", phone: "+1 (415) 555-3003", avatar: "LN", hireDate: "2020-05-20", isActive: true, department: "Pharmacy" },
  { employeeId: "EMP-004", name: "David Kim", role: "Lab Technician", branchId: "BR-002", branchName: "Healthora Westside", email: "david.kim@healthora.com", phone: "+1 (510) 555-3004", avatar: "DK", hireDate: "2022-11-10", isActive: true, department: "Laboratory" },
  { employeeId: "EMP-005", name: "Priya Patel", role: "Nurse", branchId: "BR-001", branchName: "Healthora Central", email: "priya.patel@healthora.com", phone: "+1 (415) 555-3005", avatar: "PP", hireDate: "2021-02-28", isActive: true, department: "Clinical" },
  { employeeId: "EMP-006", name: "Carlos Rivera", role: "Receptionist", branchId: "BR-002", branchName: "Healthora Westside", email: "carlos.rivera@healthora.com", phone: "+1 (510) 555-3006", avatar: "CR", hireDate: "2023-01-09", isActive: true, department: "Front Desk" },
  { employeeId: "EMP-007", name: "Fatima Al-Rashid", role: "Lab Technician", branchId: "BR-001", branchName: "Healthora Central", email: "fatima.alrashid@healthora.com", phone: "+1 (415) 555-3007", avatar: "FA", hireDate: "2022-07-14", isActive: true, department: "Laboratory" },
  { employeeId: "EMP-008", name: "Thomas Wade", role: "Pharmacist", branchId: "BR-002", branchName: "Healthora Westside", email: "thomas.wade@healthora.com", phone: "+1 (510) 555-3008", avatar: "TW", hireDate: "2021-12-01", isActive: true, department: "Pharmacy" },
  { employeeId: "EMP-009", name: "Sandra Reyes", role: "Branch Manager", branchId: "BR-001", branchName: "Healthora Central", email: "sandra.reyes@healthora.com", phone: "+1 (415) 555-3009", avatar: "SR", hireDate: "2020-01-15", isActive: true, department: "Management" },
  { employeeId: "EMP-010", name: "Robert Chang", role: "Branch Manager", branchId: "BR-002", branchName: "Healthora Westside", email: "robert.chang@healthora.com", phone: "+1 (510) 555-3010", avatar: "RC", hireDate: "2021-06-01", isActive: true, department: "Management" },
  { employeeId: "EMP-011", name: "Priya Kapoor", role: "Branch Manager", branchId: "BR-003", branchName: "Healthora South Bay", email: "priya.kapoor@healthora.com", phone: "+1 (408) 555-3011", avatar: "PK", hireDate: "2023-03-01", isActive: true, department: "Management" },
  { employeeId: "EMP-012", name: "Angela Foster", role: "Nurse", branchId: "BR-003", branchName: "Healthora South Bay", email: "angela.foster@healthora.com", phone: "+1 (408) 555-3012", avatar: "AF", hireDate: "2022-09-20", isActive: true, department: "Clinical" },
  { employeeId: "EMP-013", name: "Kevin Park", role: "Receptionist", branchId: "BR-003", branchName: "Healthora South Bay", email: "kevin.park@healthora.com", phone: "+1 (408) 555-3013", avatar: "KP", hireDate: "2023-04-15", isActive: true, department: "Front Desk" },
  { employeeId: "EMP-014", name: "Zoe Henderson", role: "Pharmacist", branchId: "BR-003", branchName: "Healthora South Bay", email: "zoe.henderson@healthora.com", phone: "+1 (408) 555-3014", avatar: "ZH", hireDate: "2022-02-01", isActive: false, department: "Pharmacy" },
  { employeeId: "EMP-015", name: "Alexander Chen", role: "Admin", branchId: "BR-001", branchName: "Healthora Central", email: "admin@healthora.com", phone: "+1 (415) 555-3015", avatar: "AC", hireDate: "2019-06-01", isActive: true, department: "Administration" },
];
