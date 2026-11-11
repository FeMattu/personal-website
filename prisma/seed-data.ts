/**
 * Seed content, taken from the current LaTeX CV and the old site texts (see docs/CONTENT_MAPPING.md).
 * Nothing here is invented: unknown data stays empty so it can be filled in from the admin.
 */

type L = { it: string; en: string }
type LList = { it: string[]; en: string[] }

/** First day of a month as a civil (UTC) date. */
const d = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1))

export const locales = [
  { code: 'it', name: 'Italiano', isDefault: true, position: 0 },
  { code: 'en', name: 'English', isDefault: false, position: 1 },
]

export const siteTexts: Record<string, L> = {
  'hero.role': {
    it: 'Sviluppatore full-stack · Studente di Laurea Magistrale in AI',
    en: 'Full-stack developer · MSc student in Artificial Intelligence',
  },
  'hero.location': { it: 'Lucca, Italia', en: 'Lucca, Italy' },
  'about.bio': {
    it: 'Laureato in Informatica (Università di Pisa), ora iscritto alla Laurea Magistrale in Intelligenza Artificiale, con esperienza pratica di sviluppo full-stack (Java, Spring Boot, Angular, React). Ho guidato un dipartimento IT in una Junior Enterprise e realizzato soluzioni web come freelance. Parlo inglese correntemente e ho esperienza internazionale. Appassionato di blockchain e criptovalute e dell’incontro tra AI e Bionic Engineering, con un focus su protesi avanzate e interfacce uomo-macchina. Cerco un ambiente competitivo e dinamico in cui portare motivazione e competenze tecniche.',
    en: 'Computer Science graduate (University of Pisa) now pursuing an MSc in Artificial Intelligence, with hands-on experience in full-stack development (Java, Spring Boot, Angular, React). Proven leadership in a Junior Enterprise and a track record of delivering freelance web solutions. Fluent in English, with international experience. Passionate about blockchain and cryptocurrencies, and about the intersection of AI and Bionic Engineering, with a focus on advanced prosthetics and human-machine interfaces. Looking for a competitive, agile environment where I can bring motivation and technical expertise.',
  },
  'about.interests': {
    it: 'Blockchain e criptovalute, Robotica medica e BCI, Cloud computing, Fotografia, Tennis, Calcio, Triathlon, Corsa.',
    en: 'Blockchain & Cryptocurrency, Medical Robotics & BCI, Cloud Computing, Photography, Tennis, Football, Triathlon, Running.',
  },
  'seo.home.description': {
    it: 'Federico Mattucci: laureato in Informatica, studente di Laurea Magistrale in AI, sviluppatore full-stack e fotografo.',
    en: 'Federico Mattucci: CS graduate, MSc AI student, full-stack developer and photographer.',
  },
}

export type ExperienceSeed = {
  slug: string
  organization: string
  role: L
  location: string
  summary: L
  highlights: LList
  startDate: Date
  endDate: Date | null
  tags: string[]
  featured: boolean
}

export const experiences: ExperienceSeed[] = [
  {
    slug: 'jevis-it-senior-associate',
    organization: 'JEVIS Junior Enterprise',
    role: { it: 'IT Senior Associate', en: 'IT Senior Associate' },
    location: 'Pisa, Italy',
    summary: {
      it: 'Mentoring dei junior e gestione del rapporto con i clienti.',
      en: 'Mentoring junior associates and managing client relationships.',
    },
    highlights: {
      it: [
        'Mentoring dei junior associate su best practice di sviluppo software e metodologie agili.',
        'Gestione dei rapporti con i clienti e traduzione dei requisiti di business in specifiche tecniche.',
      ],
      en: [
        'Mentoring junior associates on software development best practices and agile methodologies.',
        'Managing client relationships and translating business requirements into technical specifications.',
      ],
    },
    startDate: d(2026, 2),
    endDate: null,
    tags: ['Agile', 'Mentoring'],
    featured: true,
  },
  {
    slug: 'jevis-it-deputy-head',
    organization: 'JEVIS Junior Enterprise',
    role: { it: 'IT Deputy Head', en: 'IT Deputy Head' },
    location: 'Pisa, Italy',
    summary: {
      it: 'Coordinamento del dipartimento IT per progetti di consulenza gestiti da studenti.',
      en: 'Led the IT department on student-led consulting projects.',
    },
    highlights: {
      it: [
        'Guida del dipartimento IT, con coordinamento della distribuzione dei task e delle tempistiche dei progetti di consulenza gestiti da studenti.',
      ],
      en: [
        'Led the IT department, coordinating task distribution and project timelines for student-led consulting projects.',
      ],
    },
    startDate: d(2025, 9),
    endDate: d(2026, 2),
    tags: ['Leadership'],
    featured: true,
  },
  {
    slug: 'jevis-it-junior-associate',
    organization: 'JEVIS Junior Enterprise',
    role: { it: 'IT Junior Associate', en: 'IT Junior Associate' },
    location: 'Pisa, Italy',
    summary: {
      it: 'Sviluppo web interno con WordPress e plugin PHP personalizzati.',
      en: 'Internal web development with WordPress and custom PHP plugins.',
    },
    highlights: {
      it: ['Contributo a progetti web interni con WordPress e plugin PHP personalizzati.'],
      en: [
        'Contributed to internal web development projects using WordPress and custom PHP plugins.',
      ],
    },
    startDate: d(2025, 4),
    endDate: d(2025, 9),
    tags: ['WordPress', 'PHP'],
    featured: false,
  },
  {
    slug: 'hastega-full-stack-developer',
    organization: 'Hastega (Demcode Srl SB)',
    role: { it: 'Full-Stack Developer', en: 'Full-Stack Developer' },
    location: 'Lucca, Italy',
    summary: {
      it: 'Applicazioni web enterprise con Angular e Spring Boot.',
      en: 'Enterprise web applications with Angular and Spring Boot.',
    },
    highlights: {
      it: [
        'Sviluppo e manutenzione di applicazioni web enterprise con Angular (frontend) e Spring Boot (backend).',
        'Ottimizzazione delle query SQL, migliorando prestazioni di recupero dati e sicurezza del sistema.',
        'Collaborazione in un team agile per implementare API RESTful e garantire l’integrazione con il frontend.',
      ],
      en: [
        'Developed and maintained enterprise web applications using Angular (frontend) and Spring Boot (backend).',
        'Optimized SQL database queries, improving data retrieval performance and system security.',
        'Collaborated in an agile team to implement RESTful APIs and ensure seamless front-end integration.',
      ],
    },
    startDate: d(2024, 6),
    endDate: d(2024, 11),
    tags: ['Angular', 'Spring Boot', 'SQL', 'REST'],
    featured: true,
  },
  {
    slug: 'freelance-web-developer',
    organization: 'Freelance',
    role: { it: 'Web Developer e Consulente', en: 'Web Developer & Consultant' },
    location: 'Remote',
    summary: {
      it: 'Soluzioni web complete per clienti tra cui Ethibit Srl, EIS Versilia e AGB Design.',
      en: 'Full-cycle web solutions for clients including Ethibit Srl, EIS Versilia and AGB Design.',
    },
    highlights: {
      it: [
        'Realizzazione di soluzioni web complete per clienti tra cui Ethibit Srl, EIS Versilia e AGB Design.',
        'Ottimizzazione di UI/UX e prestazioni dei siti, garantendo la responsività su tutti i dispositivi.',
      ],
      en: [
        'Delivered full-cycle web solutions for clients including Ethibit Srl, EIS Versilia and AGB Design.',
        'Optimized UI/UX design and site performance, ensuring responsiveness across devices.',
      ],
    },
    startDate: d(2024, 6),
    endDate: null,
    tags: ['Web', 'UI/UX', 'Performance'],
    featured: true,
  },
  {
    slug: 'tfp-watch-social-media-photographer',
    organization: 'TFP Watch',
    role: {
      it: 'Social Media Manager, Fotografo e Modello',
      en: 'Social Media Manager, Photographer & Model',
    },
    location: 'Lucca-Florence, Italy',
    summary: {
      it: 'Strategia di contenuti digitali e fotografia di prodotto per campagne di orologi di lusso.',
      en: 'Digital content strategy and product photography for luxury watch campaigns.',
    },
    highlights: {
      it: [
        'Gestione della strategia di contenuti digitali e fotografia di prodotto di alto livello per campagne di orologi di lusso; modello nei shooting del brand.',
      ],
      en: [
        'Managed digital content strategy and conducted high-end product photography for luxury watch campaigns; also modeled in brand photo shoots.',
      ],
    },
    startDate: d(2023, 9),
    endDate: d(2026, 6),
    tags: ['Photography', 'Social Media'],
    featured: false,
  },
]

export type EducationSeed = {
  slug: string
  institution: string
  title: L
  location: string
  summary: L | null
  highlights: LList | null
  startDate: Date
  endDate: Date | null
}

export const education: EducationSeed[] = [
  {
    slug: 'unipi-msc-computer-science-ai',
    institution: 'University of Pisa',
    title: {
      it: 'Laurea Magistrale in Informatica – Intelligenza Artificiale',
      en: 'MSc in Computer Science – Artificial Intelligence',
    },
    location: 'Pisa, Italy',
    summary: {
      it: 'In corso. Conseguimento previsto: settembre 2028.',
      en: 'Ongoing. Expected: September 2028.',
    },
    highlights: null,
    startDate: d(2026, 9),
    endDate: null,
  },
  {
    slug: 'unipi-bsc-computer-science',
    institution: 'University of Pisa',
    title: { it: 'Laurea in Informatica (conseguita)', en: 'BSc in Computer Science (Graduated)' },
    location: 'Pisa, Italy',
    summary: {
      it: 'Tesi: POESIA, Proof Of ESG-Informed Authority per MultiChain.',
      en: 'Thesis: POESIA, Proof Of ESG-Informed Authority for MultiChain.',
    },
    highlights: {
      it: [
        'Tesi: POESIA (Proof Of ESG-Informed Authority for MultiChain). Progettazione e implementazione di un protocollo di consenso come fork di MultiChain (fork di Bitcoin), sviluppato con Apuana SB per la piattaforma di tracciabilità della supply chain MyLedger (C++, Python).',
        'Erasmus+: 5 mesi di studio a Barcellona, Spagna.',
      ],
      en: [
        'Thesis: POESIA: Proof Of ESG-Informed Authority for MultiChain. Designed and implemented a consensus protocol as a fork of MultiChain (Bitcoin fork), developed with Apuana SB for the MyLedger supply-chain traceability platform (C++, Python).',
        'Erasmus+ Exchange: 5 months studying abroad in Barcelona, Spain.',
      ],
    },
    startDate: d(2023, 9),
    endDate: d(2026, 10),
  },
  {
    slug: 'iti-fermi-it-telecommunications',
    institution: 'I.T.I. E. Fermi',
    title: {
      it: 'Diploma in Informatica e Telecomunicazioni',
      en: 'Diploma in IT & Telecommunications',
    },
    location: 'Lucca, Italy',
    summary: null,
    highlights: {
      it: [
        'Specializzazione in architetture di rete, protocolli di telecomunicazione e sistemi informatici.',
      ],
      en: [
        'Specialized in Network Architecture, Telecommunications protocols and Computer Systems.',
      ],
    },
    startDate: d(2018, 9),
    endDate: d(2023, 7),
  },
]

export const certifications: { slug: string; name: L; issuer: string | null }[] = [
  { slug: 'ielts-6-5', name: { it: 'IELTS 6.5', en: 'IELTS 6.5' }, issuer: null },
  {
    slug: 'blsd',
    name: { it: 'BLSD (Basic Life Support)', en: 'BLSD (Basic Life Support)' },
    issuer: null,
  },
  {
    slug: 'workplace-safety-d-lgs-81-2008',
    name: {
      it: 'Formazione su salute e sicurezza sul lavoro (D.Lgs. 81/2008)',
      en: 'Workplace Health & Safety Training (D.Lgs. 81/2008)',
    },
    issuer: null,
  },
]

export const skillCategories: { slug: string; name: L; skills: string[] }[] = [
  {
    slug: 'programming-languages',
    name: { it: 'Linguaggi di programmazione', en: 'Programming Languages' },
    skills: [
      'Java',
      'Python',
      'C/C++',
      'JavaScript',
      'TypeScript',
      'SQL',
      'Assembly',
      'Verilog',
      'PHP',
    ],
  },
  {
    slug: 'frameworks-libraries',
    name: { it: 'Framework e librerie', en: 'Frameworks & Libraries' },
    skills: ['Spring Boot', 'Angular', 'React', 'Flutter', 'Node.js'],
  },
  {
    slug: 'devops-tools',
    name: { it: 'DevOps e strumenti', en: 'DevOps & Tools' },
    skills: ['Git', 'Docker', 'JIRA', 'Linux', 'Windows', 'WordPress/Elementor'],
  },
  {
    slug: 'networking',
    name: { it: 'Reti', en: 'Networking' },
    skills: ['TCP/IP', 'LAN/WAN Architecture', 'Server Configuration', 'Network Security'],
  },
]

/** Spoken languages: named in their own language, level as an enum, detail per locale. */
export const spokenLanguages: {
  code: string
  name: string
  proficiency: 'NATIVE' | 'FLUENT'
  detail: L | null
}[] = [
  { code: 'it', name: 'Italiano', proficiency: 'NATIVE', detail: null },
  {
    code: 'en',
    name: 'English',
    proficiency: 'FLUENT',
    detail: { it: 'IELTS 6.5', en: 'IELTS 6.5' },
  },
]

/** Contact links already published on the previous site / in the CV (tracking params removed). */
export const socialLinks: {
  kind: 'GITHUB' | 'LINKEDIN' | 'INSTAGRAM' | 'EMAIL' | 'PHONE'
  label: string
  url: string
}[] = [
  { kind: 'GITHUB', label: 'GitHub', url: 'https://github.com/FeMattu' },
  {
    kind: 'LINKEDIN',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/federico-mattucci-13aa1a249/',
  },
  { kind: 'INSTAGRAM', label: 'Instagram', url: 'https://www.instagram.com/fede_mattu_' },
  { kind: 'EMAIL', label: 'Email', url: 'mailto:mattucci.federico@gmail.com' },
  { kind: 'PHONE', label: '+39 334 185 4239', url: 'tel:+393341854239' },
]

/** Client projects named in the CV. Drafts with no invented details: fill them in from the admin. */
export const draftProjects: { slug: string; title: L }[] = [
  { slug: 'ethibit', title: { it: 'Ethibit Srl', en: 'Ethibit Srl' } },
  { slug: 'eis-versilia', title: { it: 'EIS Versilia', en: 'EIS Versilia' } },
  { slug: 'agb-design', title: { it: 'AGB Design', en: 'AGB Design' } },
]
