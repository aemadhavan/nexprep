export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserExamAccess {
  id: string;
  userId: string;
  examId: string;
  grantedAt: Date;
  expiresAt?: Date;
  grantType: "auto" | "manual" | "purchase";
}
