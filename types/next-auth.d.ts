import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id:          string;
      role:        string;
      position?:   string | null;
      department?: string | null;
      phone?:      string | null;
      status?:     string | null;
      joinDate?:   string | null;
      image?:      string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?:          string;
    role?:        string;
    position?:    string | null;
    department?:  string | null;
    phone?:       string | null;
    status?:      string | null;
    joinDate?:    string | null;
    image?:       string | null;
  }
}
