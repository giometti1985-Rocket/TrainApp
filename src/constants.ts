export const COLORS = {
  bg: '#0E1410', card: '#161D18', cardAlt: '#0E1410', border: '#2A332C', borderSoft: '#1C231D',
  text: '#EDEFEA', textMuted: '#8C9A8E', textFaint: '#6B786D', accent: '#C8FF3D', accentBg: '#1F2820',
  warn: '#FF9F40', warnBg: '#1F1812', warnText: '#C9A877', blue: '#5DA8E0', blueBg: '#16202A', off: '#1A211B', offText: '#3A453C',
};

export const EFFORT_LEVELS = [
  { key: 'facil', label: 'Fácil', rank: 1 },
  { key: 'moderado', label: 'Moderado', rank: 2 },
  { key: 'dificil', label: 'Difícil', rank: 3 },
  { key: 'maximo', label: 'Máximo', rank: 4 },
] as const;

export const MEASURE_FIELDS = [
  { key: 'peso', label: 'Peso corporal', unit: 'kg' }, { key: 'cintura', label: 'Cintura/abdômen', unit: 'cm' },
  { key: 'quadril', label: 'Quadril', unit: 'cm' }, { key: 'torax', label: 'Tórax/peitoral', unit: 'cm' },
  { key: 'braco', label: 'Braço (bíceps)', unit: 'cm' }, { key: 'coxa', label: 'Coxa', unit: 'cm' },
  { key: 'pescoco', label: 'Pescoço', unit: 'cm' }, { key: 'gordura_bia', label: '% de gordura (bioimpedância)', unit: '%' },
] as const;

export const EXERCISE_CATALOG: Record<string, string[]> = {
  peito: ['Supino reto com barra', 'Supino reto com halteres', 'Supino inclinado com halteres', 'Supino máquina', 'Crucifixo com halteres', 'Crossover no cabo', 'Peck deck', 'Flexão de braço'],
  costas: ['Puxada frente (pulley)', 'Puxada triângulo', 'Remada baixa (cabo)', 'Remada curvada com barra', 'Remada unilateral com halter', 'Remada cavalinho', 'Pulldown', 'Barra fixa'],
  ombro: ['Desenvolvimento com halteres', 'Desenvolvimento máquina', 'Elevação lateral', 'Elevação frontal', 'Crucifixo invertido', 'Remada alta', 'Face pull'],
  biceps: ['Rosca direta com barra', 'Rosca alternada com halteres', 'Rosca scott', 'Rosca martelo', 'Rosca no cabo', 'Rosca 21'],
  triceps: ['Tríceps testa', 'Tríceps corda (cabo)', 'Tríceps francês', 'Mergulho no banco', 'Tríceps coice com halter', 'Supino fechado'],
  quadriceps: ['Leg press 45°', 'Cadeira extensora', 'Agachamento livre', 'Agachamento smith', 'Agachamento goblet', 'Hack squat', 'Avanço (afundo)', 'Afundo búlgaro'],
  'posterior de coxa': ['Mesa flexora', 'Cadeira flexora', 'Stiff com barra', 'Stiff com halteres', 'Levantamento terra romeno', 'Flexora unilateral no cabo'],
  gluteo: ['Elevação pélvica (hip thrust)', 'Cadeira abdutora', 'Glúteo no cabo (coice)', 'Agachamento sumô', 'Passada lateral com elástico'],
  panturrilha: ['Gemelar em pé', 'Gemelar sentado', 'Gemelar no leg press'],
  abdomen: ['Abdominal supra no solo', 'Abdominal na máquina', 'Prancha isométrica', 'Elevação de pernas', 'Abdominal infra no banco', 'Rotação de tronco no cabo'],
  'corpo todo': ['Kettlebell swing', 'Burpee', 'Mountain climber', 'Thruster com halteres', 'Battle rope', 'Corrida na esteira', 'Bike ergométrica', 'Remo ergômetro'],
};

export const SUPPLEMENT_CATALOG = [
  { key: 'whey', label: 'Whey protein', unit: 'scoop', defaultDose: 1 }, { key: 'caseina', label: 'Caseína', unit: 'scoop', defaultDose: 1 },
  { key: 'creatina', label: 'Creatina', unit: 'g', defaultDose: 5 }, { key: 'multivitaminico', label: 'Multivitamínico', unit: 'cápsula', defaultDose: 1 },
  { key: 'omega3', label: 'Ômega 3', unit: 'cápsula', defaultDose: 2 }, { key: 'bcaa', label: 'BCAA', unit: 'g', defaultDose: 5 },
  { key: 'glutamina', label: 'Glutamina', unit: 'g', defaultDose: 5 }, { key: 'cafeina', label: 'Cafeína / pré-treino', unit: 'mg', defaultDose: 200 },
  { key: 'colageno', label: 'Colágeno', unit: 'g', defaultDose: 10 }, { key: 'vitaminaD', label: 'Vitamina D', unit: 'UI', defaultDose: 2000 },
  { key: 'magnesio', label: 'Magnésio', unit: 'mg', defaultDose: 300 },
];
