import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data');
const FAVORITES_FILE = path.join(STORAGE_DIR, 'favorites.json');

export interface FavoriteDomain {
  domain: string;
  status: 'available' | 'taken' | 'premium' | 'error';
  price?: string;
  available: boolean;
  addedAt: string;
  notes?: string;
}

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

// Get all favorites
export async function getFavorites(): Promise<FavoriteDomain[]> {
  await ensureStorageDir();
  
  try {
    const data = await fs.readFile(FAVORITES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet
    return [];
  }
}

// Add a favorite
export async function addFavorite(domain: FavoriteDomain): Promise<void> {
  await ensureStorageDir();
  
  const favorites = await getFavorites();
  
  // Check if already exists
  const exists = favorites.find(f => f.domain === domain.domain);
  if (exists) {
    throw new Error('Domain already in favorites');
  }
  
  favorites.push({
    ...domain,
    addedAt: new Date().toISOString()
  });
  
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
}

// Remove a favorite
export async function removeFavorite(domain: string): Promise<void> {
  await ensureStorageDir();
  
  const favorites = await getFavorites();
  const filtered = favorites.filter(f => f.domain !== domain);
  
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(filtered, null, 2));
}

// Update favorite notes
export async function updateFavoriteNotes(domain: string, notes: string): Promise<void> {
  await ensureStorageDir();
  
  const favorites = await getFavorites();
  const favorite = favorites.find(f => f.domain === domain);
  
  if (!favorite) {
    throw new Error('Domain not found in favorites');
  }
  
  favorite.notes = notes;
  
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
}
