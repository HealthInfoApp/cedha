export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  user_type: 'medical-student' | 'resident' | 'physician' | 'nurse' | 'other' | 'admin';
  specialization?: string;
  phone_number?: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string; // Add this line
  updated_at: string; // Add this line
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  user_type: 'medical-student' | 'resident' | 'physician' | 'nurse' | 'other' | 'admin';
  specialization?: string;
  phone_number?: string;
}

export interface UpdateUserData {
  full_name?: string;
  phone_number?: string;
  profile_image?: string;
  specialization?: string;
}