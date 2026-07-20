export type Student = {
  id: string;
  name: string;
  email: string;
  course: string;
  date: string;
  status: "AKTİF" | "BEKLEMEDE" | "PASİF";
  initials: string;
};

export type Course = {
  id: string;
  title: string;
  category: string;
  instructor: string;
  students: number;
  price: string;
};

export type Enrollment = {
  id: string;
  code: string;
  student: string;
  course: string;
  date: string;
  amount: string;
  status: "TAMAMLANDI" | "BEKLEMEDE" | "İPTAL";
};

export const students: Student[] = [
  {
    id: "1",
    name: "Selin Yılmaz",
    email: "selin@edu.tr",
    course: "Veri Bilimi ve Python",
    date: "14.05.2024",
    status: "AKTİF",
    initials: "SY",
  },
  {
    id: "2",
    name: "Mert Kaya",
    email: "m.kaya@mail.com",
    course: "İleri Seviye React UI",
    date: "13.05.2024",
    status: "BEKLEMEDE",
    initials: "MK",
  },
  {
    id: "3",
    name: "Ayşe Demir",
    email: "ayse.d@edu.tr",
    course: "UX/UI Masterclass 2024",
    date: "12.05.2024",
    status: "AKTİF",
    initials: "AD",
  },
  {
    id: "4",
    name: "Emre Şahin",
    email: "emre.s@mail.com",
    course: "Girişimcilik 101",
    date: "11.05.2024",
    status: "AKTİF",
    initials: "EŞ",
  },
  {
    id: "5",
    name: "Zeynep Arslan",
    email: "z.arslan@edu.tr",
    course: "Modern Full-Stack Mimari",
    date: "10.05.2024",
    status: "PASİF",
    initials: "ZA",
  },
  {
    id: "6",
    name: "Can Öztürk",
    email: "can.o@mail.com",
    course: "Veri Bilimi ve Python",
    date: "09.05.2024",
    status: "AKTİF",
    initials: "CÖ",
  },
  {
    id: "7",
    name: "Deniz Aydın",
    email: "deniz@edu.tr",
    course: "İleri Seviye React UI",
    date: "08.05.2024",
    status: "BEKLEMEDE",
    initials: "DA",
  },
];

export const courses: Course[] = [
  {
    id: "c1",
    title: "Modern Full-Stack Mimari",
    category: "Yazılım Geliştirme",
    instructor: "Aras Demir",
    students: 1240,
    price: "₺890",
  },
  {
    id: "c2",
    title: "UX/UI Masterclass 2024",
    category: "Tasarım",
    instructor: "Elif Akın",
    students: 850,
    price: "₺1.200",
  },
  {
    id: "c3",
    title: "Girişimcilik 101",
    category: "İşletme",
    instructor: "Selim Can",
    students: 4120,
    price: "ÜCRETSİZ",
  },
  {
    id: "c4",
    title: "Veri Bilimi ve Python",
    category: "Veri Bilimi",
    instructor: "Nesrin Öz",
    students: 2340,
    price: "₺1.450",
  },
  {
    id: "c5",
    title: "İleri Seviye React UI",
    category: "Yazılım Geliştirme",
    instructor: "Baran Kılıç",
    students: 1580,
    price: "₺990",
  },
  {
    id: "c6",
    title: "Dijital Pazarlama Stratejisi",
    category: "Pazarlama",
    instructor: "İpek Yalçın",
    students: 720,
    price: "₺780",
  },
];

export const enrollments: Enrollment[] = [
  {
    id: "e1",
    code: "ENR-2024-0418",
    student: "Selin Yılmaz",
    course: "Veri Bilimi ve Python",
    date: "14.05.2024",
    amount: "₺1.450",
    status: "TAMAMLANDI",
  },
  {
    id: "e2",
    code: "ENR-2024-0417",
    student: "Mert Kaya",
    course: "İleri Seviye React UI",
    date: "13.05.2024",
    amount: "₺990",
    status: "BEKLEMEDE",
  },
  {
    id: "e3",
    code: "ENR-2024-0416",
    student: "Ayşe Demir",
    course: "UX/UI Masterclass 2024",
    date: "12.05.2024",
    amount: "₺1.200",
    status: "TAMAMLANDI",
  },
  {
    id: "e4",
    code: "ENR-2024-0415",
    student: "Emre Şahin",
    course: "Girişimcilik 101",
    date: "11.05.2024",
    amount: "₺0",
    status: "TAMAMLANDI",
  },
  {
    id: "e5",
    code: "ENR-2024-0414",
    student: "Zeynep Arslan",
    course: "Modern Full-Stack Mimari",
    date: "10.05.2024",
    amount: "₺890",
    status: "İPTAL",
  },
];

export const kpis = {
  toplamOgrenci: "12.842",
  aktifKurslar: "154",
  yeniKayitlar: "418",
  aylikGelir: "₺142K",
};

export const statusStyles: Record<string, string> = {
  AKTİF: "bg-emerald-100 text-emerald-800",
  BEKLEMEDE: "bg-amber-100 text-amber-800",
  PASİF: "bg-zinc-200 text-zinc-700",
  TAMAMLANDI: "bg-emerald-100 text-emerald-800",
  İPTAL: "bg-red-100 text-red-800",
};
