export interface Plan {
  id: number;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

export interface Company {
  id: number;
  name: string;
  category: string;
  rating: number;
  image: string;
  description: string;
  longDescription: string;
  plans: Plan[];
}

export const mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Academia FitPower',
    category: 'Saúde e Bem-estar',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
    description: 'A maior rede de academias com equipamentos de última geração.',
    longDescription: 'A Academia FitPower oferece um ecossistema completo para a sua saúde e bem-estar. Com equipamentos importados de última geração, profissionais altamente qualificados e uma grade de aulas diversificada, nosso objetivo é ajudar você a atingir a sua melhor versão. Visite nossas unidades e transforme seu estilo de vida.',
    plans: [
      { id: 101, name: 'Plano Light', price: 89.90, features: ['Acesso horário restrito', 'Aulas coletivas', 'App exclusivo'] },
      { id: 102, name: 'Plano Premium', price: 129.90, features: ['Acesso livre', 'Aulas coletivas', 'Avaliação mensal', 'Acesso a todas unidades'], isPopular: true },
    ]
  },
  {
    id: 2,
    name: 'Coworking Space 360',
    category: 'Escritórios',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1470&auto=format&fit=crop',
    description: 'Estações de trabalho modernas com internet de ultra velocidade e café à vontade.',
    longDescription: 'Projetado para freelancers, startups e grandes empresas, o Coworking Space 360 oferece o ambiente ideal para networking e produtividade. Infraestrutura premium com internet redundante de alta velocidade, salas de descompressão, cabines para call e café gourmet ilimitado.',
    plans: [
      { id: 201, name: 'Mesa Compartilhada', price: 299.00, features: ['Acesso horário comercial', 'Internet de alta velocidade', 'Café e água'] },
      { id: 202, name: 'Mesa Fixa', price: 499.00, features: ['Mesa exclusiva', 'Acesso 24/7', 'Salas de reunião (4h/mês)'], isPopular: true },
      { id: 203, name: 'Escritório Privativo', price: 1200.00, features: ['Sala fechada', 'Acesso 24/7', 'Salas de reunião ilimitadas', 'Endereço fiscal'] },
    ]
  },
  {
    id: 3,
    name: 'Plataforma EduLearn',
    category: 'Educação',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1374&auto=format&fit=crop',
    description: 'Cursos completos de tecnologia, idiomas e negócios em uma única assinatura.',
    longDescription: 'Seu parceiro de crescimento profissional e pessoal contínuo. A EduLearn possui um catálogo rotativo com os melhores especialistas do mercado em tecnologia da informação, design, marketing e negócios. Aprenda no seu próprio ritmo, obtenha certificados válidos e acelere sua carreira.',
    plans: [
      { id: 301, name: 'Estudante Mensal', price: 39.90, features: ['Mais de 2.000 cursos', 'Certificados digitais', 'Suporte no fórum'] },
      { id: 302, name: 'Pro Anual', price: 399.00, features: ['Cursos exclusivos', 'Certificados impressos', 'Mentoria 1 a 1', 'Projetos práticos'], isPopular: true },
    ]
  },
  {
    id: 4,
    name: 'Beleza Plena Spa',
    category: 'Beleza e Spa',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1470&auto=format&fit=crop',
    description: 'O seu refúgio urbano. Cuidados estéticos e relaxamento em pacotes mensais.',
    longDescription: 'Desconecte-se da agitação da cidade no Beleza Plena Spa. Nossos especialistas usam produtos naturais e veganos de alta qualidade. Oferecemos assinaturas mensais que garantem os seus momentos de autocuidado e recarregam suas energias.',
    plans: [
      { id: 401, name: 'Essential', price: 149.90, features: ['2 massagens no mês', 'Escalda pés', 'Chá relaxante'] },
      { id: 402, name: 'Plena Care', price: 299.90, features: ['4 massagens no mês', 'Limpeza de pele', 'Acesso à sauna', 'Kit de produtos'], isPopular: true },
    ]
  },
  {
    id: 5,
    name: 'Gourmet Box Mensal',
    category: 'Alimentação',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1470&auto=format&fit=crop',
    description: 'Receba ingredientes frescos e receitas exclusivas diretamente na sua casa.',
    longDescription: 'Redescubra o prazer de cozinhar. Nossa equipe de chefs e nutricionistas elabora semanalmente um menu balanceado e delicioso. Você recebe a caixa com tudo porcionado na medida exata, evitando o desperdício.',
    plans: [
      { id: 501, name: 'Casal (3 refeições)', price: 189.90, features: ['Refeições para 2 pessoas', 'Ingredientes porcionados', 'Passo a passo impresso'] },
      { id: 502, name: 'Família (5 refeições)', price: 349.90, features: ['Refeições para 4 pessoas', 'Ingredientes orgânicos extras', 'Sobremesas inclusas'], isPopular: true },
    ]
  },
  {
    id: 6,
    name: 'CodeMaster Pro',
    category: 'Tecnologia',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1472&auto=format&fit=crop',
    description: 'Ferramentas avançadas para times ágeis de desenvolvimento de software.',
    longDescription: 'Eleve a produtividade da sua equipe de engenharia. A plataforma CodeMaster integra repositórios, CI/CD, e análise de vulnerabilidades num dashboard central inteligente focado em performance.',
    plans: [
      { id: 601, name: 'Startup', price: 199.90, features: ['Até 10 desenvolvedores', 'Pipelines Ilimitados', 'Integração Git'] },
      { id: 602, name: 'Enterprise', price: 599.90, features: ['Desenvolvedores ilimitados', 'Suporte SLA 99.9%', 'Audit Logs Avançados', 'SSO via SAML'], isPopular: true },
    ]
  },
  {
    id: 7,
    name: 'Yoga Nirvana',
    category: 'Saúde e Bem-estar',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop',
    description: 'Aulas diárias de yoga para corpo, mente e alma. Conecte-se com você.',
    longDescription: 'Descubra a paz interior com os melhores instrutores de Hatha, Vinyasa e Ashtanga. Possuímos estúdios arborizados e confortáveis e uma biblioteca completa de aulas gravadas para todas as rotinas.',
    plans: [
      { id: 701, name: 'Zen Online', price: 59.90, features: ['Aulas gravadas', 'Meditações guiadas', 'Comunidade VIP'] },
      { id: 702, name: 'Harmonia Presencial', price: 189.90, features: ['Acesso a todos estúdios', 'Aulas online inclusas', 'Workshops trimestrais'], isPopular: true },
    ]
  },
  {
    id: 8,
    name: 'Prime Offices',
    category: 'Escritórios',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1469&auto=format&fit=crop',
    description: 'Locação empresarial nos centros financeiros das maiores metrópoles.',
    longDescription: 'Endereços de prestígio para a sua empresa crescer. Salas de reuniões equipadas com tecnologia verde e videoconferência imersiva. Construímos sua sala sob medida para a identidade e necessidades exclusivas da sua marca.',
    plans: [
      { id: 801, name: 'Virtual Business', price: 150.00, features: ['Endereço comercial VIP', 'Gestão de correspondência', 'Atendimento telefônico'] },
      { id: 802, name: 'Corporate Suite', price: 3500.00, features: ['Andar exclusivo', 'Recepção bilíngue', 'Garagem VIP', 'Mobília ergonômica'], isPopular: true },
    ]
  }
];
