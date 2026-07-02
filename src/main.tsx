import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { COLORS, EFFORT_LEVELS, EXERCISE_CATALOG, MEASURE_FIELDS, SUPPLEMENT_CATALOG } from './constants';
import { loadData, saveData } from './db/storage';
import type { Exercise, Meal, Measurement, NutritionGoals, NutritionLogs, Profile, SupplementsLogs, WorkoutEntry, WorkoutLogs, Effort } from './types';
import { calcBF, calcIMC, clampPercent, historyForExercise, monthlyWorkoutGoal, suggestLoad, suggestSubstitutes, todayISO, uid } from './utils';
import './styles.css';

const defaultProfile: Profile = { alturaCm: 183 };
const defaultGoals: NutritionGoals = { protein: 160, water: 3 };
const defaultExercise: Exercise = { id: '', name: '', muscleGroup: 'peito', sets: 3, repsTarget: 10, load: 20, unit: 'kg', pace: '2s descida · 1s pausa · 1s subida', rest: 60, dynamic: '', note: '', subs: [] };

type Tab = 'hoje' | 'treino' | 'nutricao' | 'progresso';
type SheetName = null | 'exercise' | 'log' | 'meal' | 'nutrition' | 'supplement' | 'measurement' | 'measureDetail';

type SheetState = { name: SheetName; payload?: any };

function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('hoje');
  const [sheet, setSheet] = useState<SheetState>({ name: null });
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogs>({});
  const [meals, setMeals] = useState<Meal[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLogs>({});
  const [supplementsLogs, setSupplementsLogs] = useState<SupplementsLogs>({});
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals>(defaultGoals);

  const today = todayISO();
  const nutritionToday = nutritionLogs[today] || { protein: 0, water: 0, mealsDone: {} };
  const supplementsToday = supplementsLogs[today] || {};
  const logsToday = workoutLogs[today] || {};
  const latestMeasurement = [...measurements].sort((a, b) => b.date.localeCompare(a.date))[0];

  useEffect(() => {
    async function boot() {
      const [p, ex, wl, ml, nl, sl, ms, ng] = await Promise.all([
        loadData('profile', defaultProfile), loadData('exercises', [] as Exercise[]), loadData('workoutLogs', {} as WorkoutLogs),
        loadData('meals', [] as Meal[]), loadData('nutritionLogs', {} as NutritionLogs), loadData('supplementsLogs', {} as SupplementsLogs),
        loadData('measurements', [] as Measurement[]), loadData('nutritionGoals', defaultGoals),
      ]);
      setProfile(p); setExercises(ex); setWorkoutLogs(wl); setMeals(ml); setNutritionLogs(nl); setSupplementsLogs(sl); setMeasurements(ms); setNutritionGoals(ng); setReady(true);
    }
    boot();
  }, []);

  const persist = {
    exercises: (value: Exercise[]) => { setExercises(value); saveData('exercises', value); },
    workoutLogs: (value: WorkoutLogs) => { setWorkoutLogs(value); saveData('workoutLogs', value); },
    meals: (value: Meal[]) => { setMeals(value); saveData('meals', value); },
    nutritionLogs: (value: NutritionLogs) => { setNutritionLogs(value); saveData('nutritionLogs', value); },
    supplementsLogs: (value: SupplementsLogs) => { setSupplementsLogs(value); saveData('supplementsLogs', value); },
    measurements: (value: Measurement[]) => { setMeasurements(value); saveData('measurements', value); },
    nutritionGoals: (value: NutritionGoals) => { setNutritionGoals(value); saveData('nutritionGoals', value); },
    profile: (value: Profile) => { setProfile(value); saveData('profile', value); },
  };

  const monthStats = useMemo(() => {
    const d = new Date();
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const done = Object.entries(workoutLogs).filter(([date, logs]) => date.startsWith(prefix) && Object.values(logs).some((l) => l.done)).length;
    return { done, goal: monthlyWorkoutGoal(d.getFullYear(), d.getMonth()) };
  }, [workoutLogs]);

  const weeklyLoad = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
    });
    return dates.filter((date) => Object.values(workoutLogs[date] || {}).some((l) => l.done)).length;
  }, [workoutLogs]);

  function openLog(exercise: Exercise) { setSheet({ name: 'log', payload: exercise }); }
  function toggleMeal(mealId: string) {
    const current = nutritionLogs[today] || { protein: 0, water: 0, mealsDone: {} };
    persist.nutritionLogs({ ...nutritionLogs, [today]: { ...current, mealsDone: { ...current.mealsDone, [mealId]: !current.mealsDone[mealId] } } });
  }
  function removeExercise(exId: string) { persist.exercises(exercises.filter((e) => e.id !== exId)); setSheet({ name: null }); }
  function removeMeal(mealId: string) { persist.meals(meals.filter((m) => m.id !== mealId)); setSheet({ name: null }); }

  if (!ready) return <div className="page"><div className="phone"><p>Carregando...</p></div></div>;

  return <div className="page">
    <div className="phone">
      <StatusBar />
      <main className="scroll">
        {tab === 'hoje' && <TodayTab {...{ exercises, meals, nutritionToday, latestMeasurement, weeklyLoad, setTab }} />}
        {tab === 'treino' && <WorkoutTab {...{ exercises, workoutLogs, logsToday, openLog, setSheet }} />}
        {tab === 'nutricao' && <NutritionTab {...{ meals, nutritionToday, nutritionGoals, supplementsToday, setSheet, toggleMeal }} />}
        {tab === 'progresso' && <ProgressTab {...{ exercises, workoutLogs, measurements, latestMeasurement, profile, monthStats, setSheet }} />}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
      <Sheets {...{ sheet, setSheet, exercises, persist, workoutLogs, meals, nutritionLogs, supplementsLogs, measurements, profile, nutritionGoals, today, removeExercise, removeMeal }} />
    </div>
  </div>;
}

function StatusBar() { return <div className="status"><span>9:41</span><span>●●●  Wi‑Fi  🔋</span></div>; }
function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: Array<[Tab, string, string]> = [['hoje', '⌂', 'Hoje'], ['treino', '◧', 'Treino'], ['nutricao', '◉', 'Nutrição'], ['progresso', '⌁', 'Progresso']];
  return <nav className="bottom-nav">{items.map(([key, icon, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}><b>{icon}</b><small>{label}</small></button>)}</nav>;
}
function Card({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) { return <section className={`card ${onClick ? 'clickable' : ''} ${className}`} onClick={onClick}>{children}</section>; }
function Button({ children, onClick, ghost, disabled }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean; disabled?: boolean }) { return <button disabled={disabled} onClick={onClick} className={ghost ? 'ghost-btn' : 'primary-btn'}>{children}</button>; }
function Field({ label, value, onChange, type = 'text', unit }: { label: string; value: any; onChange: (v: string) => void; type?: string; unit?: string }) { return <label className="field"><span>{label}</span><div><input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />{unit && <em>{unit}</em>}</div></label>; }
function SelectField({ label, value, onChange, children }: { label: string; value: string | number; onChange: (v: string) => void; children: React.ReactNode }) { return <label className="field"><span>{label}</span><div><select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></div></label>; }
function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) { return <div className="empty"><div>✦</div><h3>{title}</h3><p>{body}</p>{action && <Button onClick={onAction}>{action}</Button>}</div>; }

function TodayTab({ exercises, meals, nutritionToday, latestMeasurement, weeklyLoad, setTab }: any) {
  const percent = clampPercent(weeklyLoad, 5);
  const ankleWarn = exercises.some((e: Exercise) => e.note?.toLowerCase().includes('tornozelo'));
  return <>
    <h1>Hoje</h1>
    <Card className="hero"><Ring percent={percent} /><div><h2>{weeklyLoad}/5 sessões</h2><p>Carga semanal dos últimos 7 dias</p></div></Card>
    <div className="grid2"><Card onClick={() => setTab('treino')}><h2>{exercises.length}</h2><p>exercícios · ver lista</p></Card><Card onClick={() => setTab('nutricao')}><h2>{nutritionToday.water} L</h2><p>água hoje</p></Card></div>
    {latestMeasurement?.values?.peso && <Card><p>Peso mais recente</p><h2>{latestMeasurement.values.peso} kg</h2><small>{latestMeasurement.date}</small></Card>}
    {ankleWarn && <Card className="warn"><b>Atenção ao tornozelo</b><p>Há exercícios com observações sobre tornozelo. Revise execução e apoio.</p></Card>}
    {!exercises.length && !meals.length && <EmptyState title="Comece seu plano" body="Cadastre exercícios e refeições para acompanhar sua rotina." />}
  </>;
}
function Ring({ percent }: { percent: number }) { const r = 31, c = 2 * Math.PI * r; return <svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r={r} fill="none" stroke={COLORS.border} strokeWidth="8"/><circle cx="38" cy="38" r={r} fill="none" stroke={COLORS.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - c * percent / 100} transform="rotate(-90 38 38)"/><text x="38" y="43" textAnchor="middle" fill={COLORS.text} fontSize="15" fontWeight="800">{percent}%</text></svg>; }

function WorkoutTab({ exercises, workoutLogs, logsToday, openLog, setSheet }: any) {
  const done = Object.values(logsToday).filter((l: any) => l.done).length;
  return <><div className="header"><h1>Treino</h1><button className="mini" onClick={() => setSheet({ name: 'exercise' })}>+ Exercício</button></div>
    <Button ghost onClick={() => alert('IA removida nesta versão. Use substitutos automáticos e sugestões de carga locais.')}>Sugerir treino de hoje (local)</Button>
    <div className="grid2"><Card><h2>{exercises.length}</h2><p>total</p></Card><Card><h2>{done}</h2><p>feitos hoje</p></Card></div>
    {exercises.length === 0 && <EmptyState title="Sem exercícios" body="Adicione seu primeiro exercício pelo botão acima." />}
    {exercises.map((ex: Exercise) => <ExerciseCard key={ex.id} ex={ex} done={logsToday[ex.id]?.done} logs={workoutLogs} onLog={() => openLog(ex)} onEdit={() => setSheet({ name: 'exercise', payload: ex })} />)}
  </>;
}
function ExerciseCard({ ex, done, logs, onLog, onEdit }: any) {
  const [expanded, setExpanded] = useState(false);
  const step = ex.unit?.includes('halter') ? 2 : 5;
  const sug = suggestLoad(historyForExercise(logs, ex.id), ex.load, step);
  const subs = suggestSubstitutes(ex.name, ex.muscleGroup);
  return <Card className={done ? 'done' : ''}><div className="row" onClick={() => setExpanded(!expanded)}><div className="icon">◧</div><div className="grow"><b>{ex.name}</b><p>{ex.sets} séries × {ex.repsTarget} reps · {sug.suggested} {ex.unit}</p>{sug.dir !== 'manter' && <small className={sug.dir === 'subir' ? 'badge' : 'badge warn-badge'}>Carga {sug.dir} {sug.dir === 'subir' ? '+' : '-'}{sug.delta}</small>}</div><button className="check" onClick={(e) => { e.stopPropagation(); onLog(); }}>{done ? '✓' : ''}</button></div>{expanded && <div className="details"><Button ghost onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent('como fazer ' + ex.name + ' execução correta')}&tbm=isch`, '_blank')}>Ver execução na web</Button><p><b>Ritmo:</b> {ex.pace || '—'}</p><p><b>Intervalo:</b> {ex.rest}s · <b>Dinâmica:</b> {ex.dynamic || '—'}</p>{ex.note && <p className="note">{ex.note}</p>}<p><b>Substitutos:</b> {[...ex.subs, ...subs].slice(0, 5).join(', ') || '—'}</p><Button ghost onClick={onEdit}>Editar exercício</Button></div>}</Card>;
}

function NutritionTab({ meals, nutritionToday, nutritionGoals, supplementsToday, setSheet, toggleMeal }: any) {
  return <><div className="header"><h1>Nutrição</h1><button className="mini" onClick={() => setSheet({ name: 'meal' })}>+ Refeição</button></div>
    <Card onClick={() => setSheet({ name: 'nutrition' })}><h2>Proteína</h2><Progress value={nutritionToday.protein} total={nutritionGoals.protein} /><p>{nutritionToday.protein} / {nutritionGoals.protein} g</p></Card>
    <Card onClick={() => setSheet({ name: 'nutrition' })}><h2>Hidratação</h2><Progress value={nutritionToday.water} total={nutritionGoals.water} blue /><p>{nutritionToday.water} / {nutritionGoals.water} L</p></Card>
    <Card><h2>Suplementação</h2><p className="muted">Registro apenas, sem orientação de dose.</p>{SUPPLEMENT_CATALOG.map((s) => <div className="supp" key={s.key} onClick={() => setSheet({ name: 'supplement', payload: s })}><span>{supplementsToday[s.key]?.taken ? '✓' : '○'} {s.label}</span>{supplementsToday[s.key]?.taken && <small>{supplementsToday[s.key].dose} {s.unit}</small>}</div>)}</Card>
    {meals.length === 0 && <EmptyState title="Sem refeições" body="Cadastre suas refeições principais." />}
    {meals.map((m: Meal) => <Card key={m.id}><div className="row"><button className="check" onClick={() => toggleMeal(m.id)}>{nutritionToday.mealsDone[m.id] ? '✓' : ''}</button><div className="grow" onClick={() => setSheet({ name: 'meal', payload: m })}><b>{m.name}</b><p>{m.time} · {m.desc}</p></div></div></Card>)}
  </>;
}
function Progress({ value, total, blue }: { value: number; total: number; blue?: boolean }) { return <div className="progress"><i style={{ width: `${clampPercent(value, total)}%`, background: blue ? COLORS.blue : COLORS.accent }} /></div>; }

function ProgressTab({ exercises, workoutLogs, measurements, latestMeasurement, profile, monthStats, setSheet }: any) {
  const peso = latestMeasurement?.values?.peso;
  const bf = latestMeasurement ? calcBF(latestMeasurement.values.cintura, latestMeasurement.values.pescoco, profile.alturaCm) : null;
  return <><h1>Progresso</h1>
    <Card onClick={() => setSheet({ name: 'measurement' })}><h2>{peso ? `${peso} kg` : 'Sem peso'}</h2><p>IMC {calcIMC(peso, profile.alturaCm) || '—'}</p></Card>
    <Card onClick={() => setSheet({ name: 'measurement' })}><h2>{bf ? `${bf}%` : '—'}</h2><p>% de gordura estimado pela fórmula US Navy</p><small>Erro aproximado de 3–4 p.p. vs. métodos laboratoriais.</small></Card>
    <Card><h2>{monthStats.done} / {monthStats.goal}</h2><Progress value={monthStats.done} total={monthStats.goal} /><p>Treinos no mês · meta baseada em dias úteis</p></Card>
    <div className="header"><h2>Medidas corporais</h2><button className="mini" onClick={() => setSheet({ name: 'measurement' })}>+ Nova</button></div>
    {!measurements.length && <EmptyState title="Sem medições" body="Registre sua primeira medição corporal." action="Registrar medição" onAction={() => setSheet({ name: 'measurement' })} />}
    {MEASURE_FIELDS.map((f) => latestMeasurement?.values?.[f.key] ? <Card key={f.key} onClick={() => setSheet({ name: 'measureDetail', payload: f })}><b>{f.label}</b><p>{latestMeasurement.values[f.key]} {f.unit}</p></Card> : null)}
    {!!exercises.length && <><h2>Progressão de força</h2>{exercises.map((ex: Exercise) => { const sug = suggestLoad(historyForExercise(workoutLogs, ex.id), ex.load, ex.unit.includes('halter') ? 2 : 5); return <Card key={ex.id}><b>{ex.name}</b><p>{ex.load} → {sug.suggested} {ex.unit} · {sug.dir}</p></Card>; })}</>}
  </>;
}

function Sheets(props: any) {
  const { sheet, setSheet } = props;
  if (!sheet.name) return null;
  return <div className="overlay" onClick={() => setSheet({ name: null })}><div className="sheet" onClick={(e) => e.stopPropagation()}><div className="sheet-head"><h2>{sheetTitle(sheet.name)}</h2><button onClick={() => setSheet({ name: null })}>×</button></div>{sheet.name === 'exercise' && <ExerciseForm {...props} />}{sheet.name === 'log' && <LogForm {...props} />}{sheet.name === 'meal' && <MealForm {...props} />}{sheet.name === 'nutrition' && <NutritionForm {...props} />}{sheet.name === 'supplement' && <SupplementForm {...props} />}{sheet.name === 'measurement' && <MeasurementForm {...props} />}{sheet.name === 'measureDetail' && <MeasureDetail {...props} />}</div></div>;
}
const sheetTitle = (name: SheetName) => ({ exercise: 'Exercício', log: 'Registrar série', meal: 'Refeição', nutrition: 'Proteína e água', supplement: 'Dose do suplemento', measurement: 'Nova medição', measureDetail: 'Histórico da medida' } as any)[name || ''];

function ExerciseForm({ sheet, setSheet, exercises, persist, removeExercise }: any) {
  const editing = sheet.payload as Exercise | undefined;
  const [form, setForm] = useState<Exercise>(editing || { ...defaultExercise, id: uid() });
  const groups = Object.keys(EXERCISE_CATALOG);
  const save = () => { const next = editing ? exercises.map((e: Exercise) => e.id === form.id ? form : e) : [...exercises, form]; persist.exercises(next); setSheet({ name: null }); };
  return <div className="form"><SelectField label="Grupo muscular" value={form.muscleGroup} onChange={(v) => setForm({ ...form, muscleGroup: v })}>{groups.map((g) => <option key={g}>{g}</option>)}</SelectField><div className="chips">{EXERCISE_CATALOG[form.muscleGroup].map((n) => <button key={n} onClick={() => setForm({ ...form, name: n })}>{n}</button>)}</div><Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><div className="grid2"><Field label="Séries" type="number" value={form.sets} onChange={(v) => setForm({ ...form, sets: Number(v) })} /><Field label="Reps" type="number" value={form.repsTarget} onChange={(v) => setForm({ ...form, repsTarget: Number(v) })} /></div><div className="grid2"><Field label="Carga" type="number" value={form.load} onChange={(v) => setForm({ ...form, load: Number(v) })} /><SelectField label="Unidade" value={form.unit} onChange={(v) => setForm({ ...form, unit: v as any })}><option>kg</option><option>kg halteres</option><option>lb</option></SelectField></div><Field label="Ritmo" value={form.pace} onChange={(v) => setForm({ ...form, pace: v })} /><Field label="Intervalo" type="number" unit="s" value={form.rest} onChange={(v) => setForm({ ...form, rest: Number(v) })} /><Field label="Dinâmica" value={form.dynamic} onChange={(v) => setForm({ ...form, dynamic: v })} /><Field label="Cuidado/observação" value={form.note} onChange={(v) => setForm({ ...form, note: v })} /><Field label="Substitutos separados por vírgula" value={form.subs.join(', ')} onChange={(v) => setForm({ ...form, subs: v.split(',').map((s) => s.trim()).filter(Boolean) })} /><Button disabled={!form.name.trim()} onClick={save}>Salvar exercício</Button>{editing && <Button ghost onClick={() => removeExercise(form.id)}>Excluir exercício</Button>}</div>;
}

function LogForm({ sheet, setSheet, workoutLogs, persist, today }: any) {
  const ex = sheet.payload as Exercise;
  const previous = workoutLogs[today]?.[ex.id];
  const [sets, setSets] = useState(previous?.sets || Array.from({ length: ex.sets }, () => ({ load: ex.load, reps: ex.repsTarget })));
  const [effort, setEffort] = useState<Effort | ''>(previous?.effort || '');
  const save = () => { const entry: WorkoutEntry = { done: true, sets, effort: effort as Effort }; persist.workoutLogs({ ...workoutLogs, [today]: { ...(workoutLogs[today] || {}), [ex.id]: entry } }); setSheet({ name: null }); };
  const unmark = () => { const day = { ...(workoutLogs[today] || {}) }; delete day[ex.id]; persist.workoutLogs({ ...workoutLogs, [today]: day }); setSheet({ name: null }); };
  return <div className="form"><p>{ex.name}</p>{sets.map((s: any, i: number) => <div className="grid2" key={i}><Field label={`Série ${i + 1} carga`} type="number" value={s.load} onChange={(v) => setSets(sets.map((x: any, ix: number) => ix === i ? { ...x, load: Number(v) } : x))} /><Field label="Reps" type="number" value={s.reps} onChange={(v) => setSets(sets.map((x: any, ix: number) => ix === i ? { ...x, reps: Number(v) } : x))} /></div>)}<div className="chips effort">{EFFORT_LEVELS.map((e) => <button className={effort === e.key ? 'selected' : ''} key={e.key} onClick={() => setEffort(e.key)}>{e.label}</button>)}</div><Button disabled={!effort} onClick={save}>Salvar</Button><Button ghost onClick={unmark}>Desmarcar exercício</Button></div>;
}
function MealForm({ sheet, setSheet, meals, persist, removeMeal }: any) { const editing = sheet.payload as Meal | undefined; const [form, setForm] = useState<Meal>(editing || { id: uid(), name: '', desc: '', time: '12:00' }); const save = () => { persist.meals(editing ? meals.map((m: Meal) => m.id === form.id ? form : m) : [...meals, form]); setSheet({ name: null }); }; return <div className="form"><Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} /><Field label="Descrição" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} /><Field label="Horário" type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} /><Button disabled={!form.name.trim()} onClick={save}>Salvar refeição</Button>{editing && <Button ghost onClick={() => removeMeal(form.id)}>Excluir refeição</Button>}</div>; }
function NutritionForm({ setSheet, nutritionLogs, persist, today, nutritionGoals }: any) { const current = nutritionLogs[today] || { protein: 0, water: 0, mealsDone: {} }; const [protein, setProtein] = useState(current.protein); const [water, setWater] = useState(current.water); const [goalP, setGoalP] = useState(nutritionGoals.protein); const [goalW, setGoalW] = useState(nutritionGoals.water); const save = () => { persist.nutritionLogs({ ...nutritionLogs, [today]: { ...current, protein: Number(protein), water: Number(water) } }); persist.nutritionGoals({ protein: Number(goalP), water: Number(goalW) }); setSheet({ name: null }); }; return <div className="form"><div className="grid2"><Field label="Proteína consumida" unit="g" type="number" value={protein} onChange={setProtein} /><Field label="Água consumida" unit="L" type="number" value={water} onChange={setWater} /></div><div className="grid2"><Field label="Meta proteína" unit="g" type="number" value={goalP} onChange={setGoalP} /><Field label="Meta água" unit="L" type="number" value={goalW} onChange={setGoalW} /></div><Button onClick={save}>Salvar</Button></div>; }
function SupplementForm({ sheet, setSheet, supplementsLogs, persist, today }: any) { const s = sheet.payload; const current = supplementsLogs[today]?.[s.key]; const [dose, setDose] = useState(current?.dose || s.defaultDose); const save = () => { persist.supplementsLogs({ ...supplementsLogs, [today]: { ...(supplementsLogs[today] || {}), [s.key]: { taken: !current?.taken, dose: Number(dose) } } }); setSheet({ name: null }); }; return <div className="form"><p>{s.label}</p><Field label="Dose" unit={s.unit} type="number" value={dose} onChange={setDose} /><Button onClick={save}>{current?.taken ? 'Desmarcar' : 'Confirmar'}</Button></div>; }
function MeasurementForm({ setSheet, measurements, persist, profile }: any) { const latest = [...measurements].sort((a: Measurement, b: Measurement) => b.date.localeCompare(a.date))[0]; const [height, setHeight] = useState(profile.alturaCm); const [values, setValues] = useState<any>(latest?.values || {}); const bf = calcBF(Number(values.cintura), Number(values.pescoco), Number(height)); const save = () => { const entry = { date: todayISO(), values: Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, Number(v)])) }; persist.profile({ alturaCm: Number(height) }); persist.measurements([...measurements.filter((m: Measurement) => m.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date))); setSheet({ name: null }); }; return <div className="form"><Field label="Altura" unit="cm" type="number" value={height} onChange={setHeight} /><div className="grid2">{MEASURE_FIELDS.map((f) => <Field key={f.key} label={f.label} unit={f.unit} type="number" value={values[f.key] ?? ''} onChange={(v) => setValues({ ...values, [f.key]: v })} />)}</div><Card>{bf ? `Preview gordura estimada: ${bf}%` : 'Informe cintura e pescoço para estimar gordura.'}</Card><Button onClick={save}>Salvar medição</Button></div>; }
function MeasureDetail({ sheet, measurements }: any) { const f = sheet.payload; const rows = measurements.filter((m: Measurement) => m.values[f.key]).sort((a: Measurement, b: Measurement) => b.date.localeCompare(a.date)); return <div className="form"><h3>{f.label}</h3>{rows.map((m: Measurement) => <Card key={m.date}><div className="row"><b>{m.date}</b><span>{m.values[f.key]} {f.unit}</span></div></Card>)}</div>; }

createRoot(document.getElementById('root')!).render(<App />);
