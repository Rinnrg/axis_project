// Mock data untuk aplikasi presensi

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'hadir' | 'telat' | 'izin' | 'alpha';
  notes: string;
}

export interface Permission {
  id: string;
  employeeId: string;
  type: 'izin' | 'cuti' | 'sakit';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  position: string;
  department: string;
  role: 'employee' | 'admin';
  joinDate: string;
  photo?: string;
}

// Data karyawan
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    password: 'password123',
    phone: '081234567890',
    position: 'Software Engineer',
    department: 'IT',
    role: 'employee',
    joinDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti@example.com',
    password: 'password123',
    phone: '081234567891',
    position: 'Project Manager',
    department: 'Management',
    role: 'employee',
    joinDate: '2022-06-10',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    phone: '081234567892',
    position: 'HR Manager',
    department: 'HR',
    role: 'admin',
    joinDate: '2021-01-01',
  },
];

// Data presensi
export const mockAttendance: Attendance[] = [
  {
    id: '1',
    employeeId: '1',
    date: '2024-07-20',
    checkInTime: '08:15',
    checkOutTime: '17:30',
    status: 'hadir',
    notes: 'Normal',
  },
  {
    id: '2',
    employeeId: '1',
    date: '2024-07-19',
    checkInTime: '09:05',
    checkOutTime: '17:45',
    status: 'telat',
    notes: 'Traffic jam',
  },
  {
    id: '3',
    employeeId: '1',
    date: '2024-07-18',
    checkInTime: null,
    checkOutTime: null,
    status: 'izin',
    notes: 'Izin sakit',
  },
  {
    id: '4',
    employeeId: '1',
    date: '2024-07-17',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    status: 'hadir',
    notes: 'Normal',
  },
  {
    id: '5',
    employeeId: '2',
    date: '2024-07-20',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    status: 'hadir',
    notes: 'Normal',
  },
  {
    id: '6',
    employeeId: '2',
    date: '2024-07-19',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    status: 'hadir',
    notes: 'Normal',
  },
];

// Data izin/cuti
export const mockPermissions: Permission[] = [
  {
    id: '1',
    employeeId: '1',
    type: 'cuti',
    startDate: '2024-08-01',
    endDate: '2024-08-05',
    reason: 'Liburan keluarga',
    status: 'pending',
    createdAt: '2024-07-15',
  },
  {
    id: '2',
    employeeId: '1',
    type: 'sakit',
    startDate: '2024-07-18',
    endDate: '2024-07-18',
    reason: 'Demam',
    status: 'approved',
    createdAt: '2024-07-17',
  },
  {
    id: '3',
    employeeId: '1',
    type: 'izin',
    startDate: '2024-07-10',
    endDate: '2024-07-10',
    reason: 'Acara keluarga',
    status: 'approved',
    createdAt: '2024-07-09',
  },
  {
    id: '4',
    employeeId: '2',
    type: 'cuti',
    startDate: '2024-08-10',
    endDate: '2024-08-14',
    reason: 'Honeymoon',
    status: 'pending',
    createdAt: '2024-07-16',
  },
];
