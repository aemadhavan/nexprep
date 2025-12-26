export interface Exam {
  id: string;
  code: string;
  name: string;
  provider: string;
  description: string;
  phase: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Domain {
  id: string;
  examId: string;
  title: string;
  order: number;
  createdAt: Date;
  exam?: Exam;
}

export interface Category {
  id: string;
  domainId: string;
  title: string;
  order: number;
  createdAt: Date;
  domain?: Domain;
}

export interface Skill {
  id: string;
  categoryId: string;
  title: string;
  order: number;
  createdAt: Date;
  category?: Category;
}
