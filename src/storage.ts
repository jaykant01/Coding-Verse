import { Category, Problem } from './types';
import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

// Create Supabase client directly here
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Environment check
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Create a .env file in your project root with:');
  console.error('   VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Create a .env file in your project root with:');
  console.error('   VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  throw new Error('Missing Supabase environment variables');
}

// Ensure a single Supabase client instance across HMR and the app
const existingClient = (globalThis as any).__supabaseClient;
export const supabase = existingClient ?? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Use a dedicated storage key to avoid conflicts and multiple GoTrueClient warnings
    storageKey: 'coding-platform-auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
if (!existingClient) {
  (globalThis as any).__supabaseClient = supabase;
}



const STORAGE_KEY = 'coding-platform-data-v1';

export async function loadData(): Promise<Category[]> {
	// Try to load from Supabase if authenticated, otherwise use local storage
	try {
		const { data: sessionData } = await supabase.auth.getSession();
		
		if (sessionData.session) {
			const currentUserId = sessionData.session.user.id;
			const isAdmin = await getIsAdminUser();
			
			if (isAdmin) {
				// Admin loads and edits own catalog
				const { data: categoriesData, error: categoriesError } = await supabase
					.from('categories')
					.select('id, title, order_index')
					.eq('user_id', currentUserId)
					.order('order_index', { ascending: true });
				if (categoriesError) throw categoriesError;
				
				const { data: problemsData, error: problemsError } = await supabase
					.from('problems')
					.select('id, category_id, title, url, platform, difficulty, completed, note')
					.eq('user_id', currentUserId);
				if (problemsError) throw problemsError;
				
				if (categoriesData && problemsData) {
					const categories: Category[] = categoriesData.map((cat: any) => ({
						id: cat.id,
						title: cat.title,
						problems: problemsData
							.filter((prob: any) => prob.category_id === cat.id)
							.map((prob: any) => ({
								id: prob.id,
								title: prob.title,
								url: prob.url,
								platform: prob.platform,
								difficulty: prob.difficulty,
								completed: prob.completed,
								note: prob.note
							}))
					}));
					return categories;
				}
			} else {
				// Sub-user: read admin-owned catalog, overlay personal progress
				const { data: categoriesData, error: categoriesError } = await supabase
					.from('categories')
					.select('id, title, order_index')
					.order('order_index', { ascending: true });
				if (categoriesError) throw categoriesError;
				
				const { data: problemsData, error: problemsError } = await supabase
					.from('problems')
					.select('id, category_id, title, url, platform, difficulty');
				if (problemsError) throw problemsError;
				
				const { data: progressData, error: progressError } = await supabase
					.from('user_problem_progress')
					.select('problem_id, completed, note')
					.eq('user_id', currentUserId);
				if (progressError) throw progressError;
				
				const progressByProblem = new Map<string, { completed: boolean; note: string | null }>();
				(progressData ?? []).forEach((row: any) => {
					progressByProblem.set(row.problem_id, { completed: !!row.completed, note: row.note ?? '' });
				});
				
				if (categoriesData && problemsData) {
					const categories: Category[] = categoriesData.map((cat: any) => ({
						id: cat.id,
						title: cat.title,
						problems: problemsData
							.filter((prob: any) => prob.category_id === cat.id)
							.map((prob: any) => {
								const overlay = progressByProblem.get(prob.id);
								return {
									id: prob.id,
									title: prob.title,
									url: prob.url,
									platform: prob.platform,
									difficulty: prob.difficulty,
									completed: overlay ? overlay.completed : false,
									note: overlay ? overlay.note ?? '' : ''
								};
							})
					}));
					return categories;
				}
			}
		}
	} catch (e) {
		console.error('Supabase load error, falling back to local:', e);
		// If it's a resource error, wait a bit before trying again
		if (e instanceof Error && e.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
			console.log('Resource limit reached, waiting before retry...');
			// Don't retry immediately - let the user continue with local data
		}
	}
	
	// Always try local storage as fallback (for both authenticated and non-authenticated users)
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const localData = raw ? (JSON.parse(raw) as Category[]) : [];
		
		// If no local data and not authenticated, show some default data
		if (localData.length === 0) {
			return [
				{
					id: 'default-1',
					title: 'Sample Problems',
					problems: [
						{
							id: 'p1',
							title: 'Two Sum',
							url: 'https://leetcode.com/problems/two-sum/',
							platform: 'LeetCode',
							difficulty: 'Easy',
							completed: false,
							note: ''
						},
						{
							id: 'p2',
							title: 'Add Two Numbers',
							url: 'https://leetcode.com/problems/add-two-numbers/',
							platform: 'LeetCode',
							difficulty: 'Medium',
							completed: false,
							note: ''
						}
					]
				}
			];
		}
		
		return localData;
	} catch (e) {
		console.error('Failed to load data', e);
		return [];
	}
}

// Add throttling and debouncing for save operations
let saveTimeout: NodeJS.Timeout | null = null;
let lastSaveTime = 0;
const SAVE_DEBOUNCE_MS = 100; // Reduced to 100ms for faster response
const MIN_SAVE_INTERVAL_MS = 500; // Reduced to 500ms for faster saves

export async function saveData(categories: Category[], forceImmediate = false): Promise<void> {
	try {
		// Always save to local storage as backup
		localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
	} catch (e) {
		console.error('Failed to save data locally', e);
	}

	// Clear any existing timeout
	if (saveTimeout) {
		clearTimeout(saveTimeout);
	}

	// If force immediate is true, save right away (for critical operations like adding problems)
	if (forceImmediate) {
		await saveDataToSupabase(categories);
		return;
	}

	// Check if enough time has passed since last save
	const now = Date.now();
	if (now - lastSaveTime < MIN_SAVE_INTERVAL_MS) {
		// Debounce the save operation
		saveTimeout = setTimeout(() => {
			saveDataToSupabase(categories);
		}, SAVE_DEBOUNCE_MS);
		return;
	}

	// Save immediately if enough time has passed
	await saveDataToSupabase(categories);
}

async function saveDataToSupabase(categories: Category[], retryCount = 0): Promise<void> {
	const MAX_RETRIES = 3;
	const BASE_DELAY = 1000; // 1 second
	try {
		// Check if user is authenticated
		const { data: sessionData } = await supabase.auth.getSession();
		
		if (sessionData.session) {
			// Update last save time
			lastSaveTime = Date.now();

			const isAdmin = await getIsAdminUser();
			if (isAdmin) {
				// Admin updates the catalog (categories + problems)
				// Determine deletions by comparing existing rows with desired payload
				const currentUserId = sessionData.session.user.id;
				const { data: existingCategories, error: existingCatErr } = await supabase
					.from('categories')
					.select('id')
					.eq('user_id', currentUserId);
				if (existingCatErr) {
					console.error('Fetch existing categories error:', existingCatErr);
					throw existingCatErr;
				}

				const { data: existingProblems, error: existingProbErr } = await supabase
					.from('problems')
					.select('id')
					.eq('user_id', currentUserId);
				if (existingProbErr) {
					console.error('Fetch existing problems error:', existingProbErr);
					throw existingProbErr;
				}

				const categoriesPayload = categories.map((cat, index) => ({
					id: cat.id,
					title: cat.title,
					order_index: index,
					user_id: currentUserId,
				}));
				const { error: categoriesError } = await supabase
					.from('categories')
					.upsert(categoriesPayload, { onConflict: 'id' });
				if (categoriesError) {
					console.error('Categories save error:', categoriesError);
					throw categoriesError;
				}
				
				const problemsPayload = categories.flatMap((cat) =>
					cat.problems.map((prob) => ({
						id: prob.id,
						category_id: cat.id,
						title: prob.title,
						url: prob.url,
						platform: prob.platform,
						difficulty: prob.difficulty,
						completed: prob.completed,
						note: prob.note,
						user_id: currentUserId
					}))
				);
				const { error: problemsError } = await supabase
					.from('problems')
					.upsert(problemsPayload, { onConflict: 'id' });
				if (problemsError) {
					console.error('Problems save error:', problemsError);
					throw problemsError;
				}

				// Compute and perform deletions for rows that were removed in the UI
				const desiredCategoryIds = new Set(categories.map((c) => c.id));
				const desiredProblemIds = new Set(
					categories.flatMap((c) => c.problems.map((p) => p.id))
				);

				const categoriesToDelete = (existingCategories ?? [])
					.map((row: any) => row.id)
					.filter((id: string) => !desiredCategoryIds.has(id));

				const problemsToDelete = (existingProblems ?? [])
					.map((row: any) => row.id)
					.filter((id: string) => !desiredProblemIds.has(id));

				if (problemsToDelete.length > 0) {
					const { error: delProblemsError } = await supabase
						.from('problems')
						.delete()
						.in('id', problemsToDelete)
						.eq('user_id', currentUserId);
					if (delProblemsError) {
						console.error('Problems delete error:', delProblemsError);
						throw delProblemsError;
					}
				}

				if (categoriesToDelete.length > 0) {
					const { error: delCategoriesError } = await supabase
						.from('categories')
						.delete()
						.in('id', categoriesToDelete)
						.eq('user_id', currentUserId);
					if (delCategoriesError) {
						console.error('Categories delete error:', delCategoriesError);
						throw delCategoriesError;
					}
				}
				console.log('Catalog saved by admin', new Date().toISOString());
			} else {
				// Sub-user: only upsert per-user progress
				const progressPayload = categories.flatMap((cat) =>
					cat.problems.map((prob) => ({
						user_id: sessionData.session!.user.id,
						problem_id: prob.id,
						completed: prob.completed,
						note: prob.note ?? null,
					}))
				);
				const { error: uppError } = await supabase
					.from('user_problem_progress')
					.upsert(progressPayload, { onConflict: 'user_id,problem_id' });
				if (uppError) {
					console.error('Progress save error:', uppError);
					throw uppError;
				}
				console.log('User progress saved');
			}
		} else {
			// Not authenticated - only save to local storage (already done above)
			console.log('No authenticated session, saving to local storage only');
		}
	} catch (e) {
		console.error('Failed to save data to Supabase:', e);
		
		// Retry with exponential backoff for resource errors
		if (retryCount < MAX_RETRIES && e instanceof Error && 
			(e.message.includes('ERR_INSUFFICIENT_RESOURCES') || e.message.includes('rate limit'))) {
			const delay = BASE_DELAY * Math.pow(2, retryCount);
			console.log(`Retrying save in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
			
			setTimeout(() => {
				saveDataToSupabase(categories, retryCount + 1);
			}, delay);
			return;
		}
		
		// For critical operations, we might want to show an error to the user
		if (retryCount === 0) {
			console.warn('Initial save failed, data saved locally as backup');
		}
		
		// Don't throw - local storage is already saved as backup
		// Reset the last save time to allow retry sooner
		lastSaveTime = 0;
	}
}

export function hasRemote(): boolean {
	return true; // Always true since we're using supabase-client.js
}

// --- Auth helpers (for gating write access) ---
export async function getIsAuthenticated(): Promise<boolean> {
	try {
		const { data, error } = await supabase.auth.getSession();
		
		if (error) {
			console.error('Auth check error:', error);
			return false;
		}
		
		return Boolean(data.session);
	} catch (e) {
		console.error('Auth check error:', e);
		return false;
	}
}

export async function signUpWithEmail(email: string, password: string, userData: {
	name: string;
	dob: string;
	university: string;
	city: string;
	country: string;
	state: string;
}): Promise<{ error?: string }> {
	try {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: userData
			}
		});
		
		if (error) {
			// Handle specific error cases
			if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
				return { error: 'An account with this email already exists. Please sign in instead.' };
			}
			if (error.message.includes('password')) {
				return { error: 'Password must be at least 6 characters long.' };
			}
			if (error.message.includes('email')) {
				return { error: 'Please enter a valid email address.' };
			}
			return { error: `Signup failed: ${error.message}` };
		}
		
		// Store additional user data in a separate profiles table
		if (data.user) {
			const { error: profileError } = await supabase
				.from('user_profiles')
				.insert({
					user_id: data.user.id,
					name: userData.name,
					dob: userData.dob,
					university: userData.university,
					city: userData.city,
					country: userData.country,
					state: userData.state,
					email: email
				});
			
			if (profileError) {
				console.error('Profile creation error:', profileError);
			}
		}
		
		return { error: undefined };
	} catch (e) {
		return { error: e instanceof Error ? e.message : 'Sign up failed' };
	}
}

export async function signInWithEmail(email: string, password: string): Promise<{ error?: string }> {
	try {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		
		if (error) {
			// Handle specific sign-in error cases
			if (error.message.includes('Invalid login credentials')) {
				return { error: 'Invalid email or password. Please check your credentials.' };
			}
			if (error.message.includes('Email not confirmed')) {
				return { error: 'Please check your email and confirm your account before signing in.' };
			}
			return { error: error.message };
		}
		
		return { error: undefined };
	} catch (e) {
		return { error: 'Sign in failed. Please try again.' };
	}
}

export async function signOut(): Promise<void> {
	try {
		await supabase.auth.signOut();
	} catch (e) {
		console.error('Sign out error:', e);
	}
}

// Helper function to try password reset (this might help with stale accounts)
export async function resetPassword(email: string): Promise<{ error?: string }> {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: window.location.origin
		});
		
		if (error) {
			return { error: error.message };
		}
		
		return { error: undefined };
	} catch (e) {
		return { error: 'Password reset failed' };
	}
}



export function onAuthChange(cb: (isAuthed: boolean) => void): () => void {
	try {
		const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
			// Use the session directly instead of making another API call
			const authed = Boolean(session);
			cb(authed);
		});
		return () => sub.subscription.unsubscribe();
	} catch (e) {
		console.error('Auth change subscription error:', e);
		return () => {};
	}
}

// Simple admin check helper using presence in app_admins
export async function getIsAdminUser(): Promise<boolean> {
	try {
		const { data: sessionData } = await supabase.auth.getSession();
		const userId = sessionData.session?.user.id;
		if (!userId) return false;
		const { data, error } = await supabase
			.from('app_admins')
			.select('user_id')
			.eq('user_id', userId)
			.limit(1)
			.maybeSingle();
		if (error) return false;
		return Boolean(data?.user_id);
	} catch {
		return false;
	}
}





// --- Realtime: refresh when any row changes ---
export function onRemoteCategoriesChange(cb: () => void): () => void {
	try {
		const channel = supabase
			.channel('categories-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => cb())
			.on('postgres_changes', { event: '*', schema: 'public', table: 'problems' }, () => cb())
			.on('postgres_changes', { event: '*', schema: 'public', table: 'user_problem_progress' }, () => cb())
			.subscribe();
		return () => { if (channel) supabase.removeChannel(channel); };
	} catch (e) {
		console.error('Realtime subscription error:', e);
		return () => {};
	}
}