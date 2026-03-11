export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  session: any; // Supabase session
  loading: boolean;
}