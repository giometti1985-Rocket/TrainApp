import { EFFORT_LEVELS, EXERCISE_CATALOG } from './constants';
import type { Effort, WorkoutEntry } from './types';

export const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const clampPercent = (value: number, total: number) => total <= 0 ? 0 : Math.min(Math.round((value / total) * 100), 100);

export function calcBF(cintura?: number, pescoco?: number, alturaCm?: number) {
  const delta = (cintura || 0) - (pescoco || 0);
  if (!cintura || !pescoco || !alturaCm || delta <= 0) return null;
  const bf = 86.01 * Math.log10(delta) - 70.041 * Math.log10(alturaCm) + 36.76;
  return Math.round(bf * 10) / 10;
}

export function calcIMC(pesoKg?: number, alturaCm?: number) {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  return Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10;
}

export function businessDaysInMonth(year: number, monthIndex: number) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, monthIndex, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
export const monthlyWorkoutGoal = (year: number, monthIndex: number) => Math.floor((businessDaysInMonth(year, monthIndex) * 3) / 5);

export function suggestLoad(history: Array<{ load: number; effort: Effort }>, currentLoad: number, stepDefault: number) {
  if (!history || history.length < 3) return { dir: 'manter' as const, delta: 0, suggested: currentLoad };
  const last3 = history.slice(-3);
  const sameLoad = last3.every((h) => h.load === last3[0].load);
  if (!sameLoad) return { dir: 'manter' as const, delta: 0, suggested: currentLoad };
  const avgEffort = last3.reduce((sum, h) => sum + (EFFORT_LEVELS.find((e) => e.key === h.effort)?.rank || 2), 0) / 3;
  if (avgEffort <= 2) return { dir: 'subir' as const, delta: stepDefault, suggested: +(currentLoad + stepDefault).toFixed(1) };
  if (avgEffort >= 3.3) return { dir: 'baixar' as const, delta: stepDefault, suggested: Math.max(+(currentLoad - stepDefault).toFixed(1), 0) };
  return { dir: 'manter' as const, delta: 0, suggested: currentLoad };
}

export function detectEquipment(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('halter') || n.includes('goblet')) return 'halteres';
  if (n.includes('máquina') || n.includes('maquina') || n.includes('smith') || n.includes('leg press') || n.includes('peck deck') || n.includes('hack squat') || n.includes('pulley') || n.includes('flexora') || n.includes('extensora') || n.includes('abdutora')) return 'maquina';
  if (n.includes('barra') || n.includes('fixa') || n.includes('livre')) return 'barra';
  if (n.includes('cabo') || n.includes('crossover') || n.includes('coice') || n.includes('face pull') || n.includes('rotação de tronco')) return 'cabo';
  if (n.includes('corpo') || n.includes('flexão') || n.includes('prancha') || n.includes('burpee') || n.includes('mountain') || n.includes('solo') || n.includes('avanço') || n.includes('afundo')) return 'peso corporal';
  return 'outro';
}

const OPPOSITE_EQUIPMENT: Record<string, string[]> = { halteres: ['maquina', 'barra', 'cabo'], maquina: ['halteres', 'barra'], barra: ['halteres', 'maquina'], cabo: ['halteres', 'maquina'], 'peso corporal': ['halteres', 'maquina'], outro: [] };
export function suggestSubstitutes(exerciseName: string, muscleGroup: string) {
  if (!muscleGroup || !EXERCISE_CATALOG[muscleGroup]) return [];
  const currentEquip = detectEquipment(exerciseName);
  const priorityEquip = OPPOSITE_EQUIPMENT[currentEquip] || [];
  return EXERCISE_CATALOG[muscleGroup]
    .filter((n) => n !== exerciseName)
    .map((name) => ({ name, score: priorityEquip.indexOf(detectEquipment(name)) === -1 ? priorityEquip.length : priorityEquip.indexOf(detectEquipment(name)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((s) => s.name);
}

export function historyForExercise(logs: Record<string, Record<string, WorkoutEntry>>, exId: string) {
  return Object.entries(logs).sort(([a], [b]) => a.localeCompare(b)).flatMap(([, day]) => {
    const entry = day[exId];
    if (!entry?.done) return [];
    const avgLoad = entry.sets.reduce((s, set) => s + Number(set.load || 0), 0) / Math.max(entry.sets.length, 1);
    return [{ load: +avgLoad.toFixed(1), effort: entry.effort }];
  });
}
