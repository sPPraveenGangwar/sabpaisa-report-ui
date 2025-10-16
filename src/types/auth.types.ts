export interface User {
  id: number;
  login_master_id: string;
  username: string;
  email: string;
  mobile?: string;
  role: 'ADMIN' | 'MERCHANT';
  role_id: number;
  client_code?: string;
  client_id?: number;
  merchant_name?: string;
  is_active: boolean;
  is_staff?: boolean;
  allowed_zones?: string[];
  is_parent_merchant?: boolean;
  parent_merchant_id?: number | null;
  last_login?: string;
  created_at?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  login_master_id?: string;
  username?: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    access: string;
    refresh: string;
    user: User;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}