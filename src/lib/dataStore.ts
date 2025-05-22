// Simple in-memory data store with expiration
import { v4 as uuidv4 } from 'uuid';

interface StoredData {
  data: any;
  timestamp: number;
}

// In-memory storage with expiration (30 minutes)
const dataStore = new Map<string, StoredData>();
const EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

// Clean up expired data every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of dataStore.entries()) {
    if (now - entry.timestamp > EXPIRATION_MS) {
      dataStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

export function storeData(data: any): string {
  const id = uuidv4();
  dataStore.set(id, {
    data,
    timestamp: Date.now()
  });
  return id;
}

export function getData(id: string): any | null {
  const entry = dataStore.get(id);
  if (!entry) return null;

  // Check if data has expired
  if (Date.now() - entry.timestamp > EXPIRATION_MS) {
    dataStore.delete(id);
    return null;
  }

  return entry.data;
}
