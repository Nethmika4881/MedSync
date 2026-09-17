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
  { employeeId: "EMP-006", name: "Carlos Rivera", role: "Receptionist", branchId: "BR-002", branchName: "Healthora Westside", email: "carlos.rivera@healthora.com", phone: "+1 (510) 555-3006", avatar: "CR", hireDate: "2023-01-09", isActive: true, department: "Front Desk" },
  { employeeId: "EMP-013", name: "Kevin Park", role: "Receptionist", branchId: "BR-003", branchName: "Healthora South Bay", email: "kevin.park@healthora.com", phone: "+1 (408) 555-3013", avatar: "KP", hireDate: "2023-04-15", isActive: true, department: "Front Desk" },
  { employeeId: "EMP-015", name: "Alexander Chen", role: "Admin", branchId: "BR-001", branchName: "Healthora Central", email: "admin@healthora.com", phone: "+1 (415) 555-3015", avatar: "AC", hireDate: "2019-06-01", isActive: true, department: "Administration" },
];

