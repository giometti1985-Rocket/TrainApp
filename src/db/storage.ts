import Dexie, { Table } from 'dexie';

type KVItem = { key: string; value: unknown };

class TrainAppDB extends Dexie {
  kv!: Table<KVItem, string>;
  constructor() {
    super('trainapp-fitness-db');
    this.version(1).stores({ kv: 'key' });
  }
}

const db = new TrainAppDB();

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const item = await db.kv.get(key);
    return item?.value === undefined ? fallback : (item.value as T);
  } catch (error) {
    console.error(`Erro ao carregar ${key}`, error);
    return fallback;
  }
}

export async function saveData<T>(key: string, value: T): Promise<void> {
  try {
    await db.kv.put({ key, value });
  } catch (error) {
    console.error(`Erro ao salvar ${key}`, error);
  }
}
