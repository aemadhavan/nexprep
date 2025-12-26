export interface UploadFlashcard {
  question: string;
  answer: string;
  explanation?: string;
}

export interface UploadSkill {
  title: string;
  order: number;
  flashcards: UploadFlashcard[];
}

export interface UploadCategory {
  title: string;
  order: number;
  skills: UploadSkill[];
}

export interface UploadDomain {
  title: string;
  order: number;
  categories: UploadCategory[];
}

export interface UploadExam {
  code: string;
  name: string;
  provider: string;
  description: string;
  phase: number;
  price: number;
}

export interface ExamUploadPayload {
  exam: UploadExam;
  domains: UploadDomain[];
}
