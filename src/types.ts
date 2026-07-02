export type Effort = 'facil' | 'moderado' | 'dificil' | 'maximo';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  repsTarget: number;
  load: number;
  unit: 'kg' | 'kg halteres' | 'lb';
  pace: string;
  rest: number;
  dynamic: string;
  note: string;
  subs: string[];
};

export type WorkoutEntry = {
  done: boolean;
  sets: Array<{ load: number; reps: number }>;
  effort: Effort;
};

export type WorkoutLogs = Record<string, Record<string, WorkoutEntry>>;

export type Meal = {
  id: string;
  name: string;
  desc: string;
  time: string;
};

export type NutritionDay = {
  protein: number;
  water: number;
  mealsDone: Record<string, boolean>;
};

export type SupplementLog = Record<string, { taken: boolean; dose: number }>;
export type NutritionLogs = Record<string, NutritionDay>;
export type SupplementsLogs = Record<string, SupplementLog>;

export type Measurement = {
  date: string;
  values: Partial<Record<'peso' | 'cintura' | 'quadril' | 'torax' | 'braco' | 'coxa' | 'pescoco' | 'gordura_bia', number>>;
};

export type Profile = { alturaCm: number };
export type NutritionGoals = { protein: number; water: number };
