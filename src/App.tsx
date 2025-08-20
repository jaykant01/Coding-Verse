import { useEffect, useMemo, useState } from 'react';
import { Category, Difficulty, Platform, Problem } from './types';
import { loadData, saveData, onRemoteCategoriesChange, getIsAuthenticated, signInWithEmail, signUpWithEmail, signOut, onAuthChange, resetPassword, getIsAdminUser } from './storage';
import { generateId, flattenProblems } from './utils';
import { Controls } from './components/Controls';
import { CategoryCard } from './components/CategoryCard';

export default function App() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [authEmail, setAuthEmail] = useState('');
	const [authPassword, setAuthPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showAuthForm, setShowAuthForm] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');
	
	// Signup form fields
	const [signupData, setSignupData] = useState({
		name: '',
		dob: '',
		university: '',
		city: '',
		country: '',
		state: ''
	});

	useEffect(() => {
		(async () => {
			const data = await loadData();
			if (data.length) {
				setCategories(data);
			} else {
				// Start with empty state - no default categories
				setCategories([]);
			}
			setLoading(false);
		})();

		// Subscribe to remote changes for live updates across devices
		const off = onRemoteCategoriesChange(async () => {
			const latest = await loadData();
			setCategories(latest);
		});
		return () => off();
	}, []);

	// Check authentication status
	useEffect(() => {
		const off = onAuthChange((authed) => {
			console.log('Auth state changed:', authed);
			setIsAuthenticated(authed);
			if (authed) {
				getIsAdminUser().then(setIsAdmin).catch(() => setIsAdmin(false));
			} else {
				setIsAdmin(false);
			}
		});
		return () => off();
	}, []);

	const [search, setSearch] = useState('');
	const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | undefined>(undefined);

	useEffect(() => {
		if (!loading) {
			saveData(categories).catch((error) => {
				// Update connection status based on save errors
				if (error && error.message && error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
					setConnectionStatus('error');
					// Reset to connected after 5 seconds
					setTimeout(() => setConnectionStatus('connected'), 5000);
				}
			});
		}
	}, [categories, loading]);

	const progress = useMemo(() => {
		const all = flattenProblems(categories);
		const done = all.filter((p) => p.completed).length;
		const pct = all.length ? Math.round((done / all.length) * 100) : 0;
		return { all: all.length, done, pct };
	}, [categories]);

	function createCategory(title: string) {
		setCategories((prev) => [...prev, { id: generateId('c'), title, problems: [] }]);
	}

	function addProblem(categoryId: string, problem: Problem) {
		setCategories((prev) =>
			prev.map((c) => (c.id === categoryId ? { ...c, problems: [...c.problems, problem] } : c))
		);
	}

	function updateProblem(categoryId: string, problemId: string, updater: (p: Problem) => Problem) {
		setCategories((prev) =>
			prev.map((c) =>
				c.id !== categoryId
					? c
					: { ...c, problems: c.problems.map((p) => (p.id === problemId ? updater(p) : p)) }
			)
		);
	}

	function deleteProblem(categoryId: string, problemId: string) {
		setCategories((prev) =>
			prev.map((c) => (c.id === categoryId ? { ...c, problems: c.problems.filter((p) => p.id !== problemId) } : c))
		);
	}

	function deleteCategory(categoryId: string) {
		setCategories((prev) => prev.filter((c) => c.id !== categoryId));
	}

	function updateCategory(categoryId: string, updates: Partial<Category>) {
		setCategories((prev) =>
			prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
		);
	}

	function randomPick() {
		const all = flattenProblems(categories).filter((p) => !p.completed);
		if (!all.length) return alert('All problems completed!');
		const pick = all[Math.floor(Math.random() * all.length)];
		window.open(pick.url, '_blank');
	}

	const filteredCategories = useMemo(() => {
		const s = search.trim().toLowerCase();
		return categories.map((c) => ({
			...c,
			problems: c.problems.filter((p) => {
				const okSearch = !s || p.title.toLowerCase().includes(s);
				const okDiff = !filterDifficulty || p.difficulty === filterDifficulty;
				return okSearch && okDiff;
			}),
		}));
	}, [categories, search, filterDifficulty]);

	// Drag-and-drop: track which category index is being dragged
	const [dragIndex, setDragIndex] = useState<number | null>(null);

	function handleDragStart(index: number) {
		return (e: React.DragEvent<HTMLDivElement>) => {
			setDragIndex(index);
			try {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', String(index));
				// Add visual feedback
				if (e.currentTarget) {
					e.currentTarget.style.opacity = '0.5';
				}
			} catch {}
		};
	}

	function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
	}

	function handleDrop(targetIndex: number) {
		return (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (dragIndex === null || dragIndex === targetIndex) return;
			
			// Find the actual category IDs from the filtered array
			const draggedCategory = filteredCategories[dragIndex];
			const targetCategory = filteredCategories[targetIndex];
			
			if (!draggedCategory || !targetCategory) return;
			
			// Find the actual indices in the original categories array
			const originalDragIndex = categories.findIndex(cat => cat.id === draggedCategory.id);
			const originalTargetIndex = categories.findIndex(cat => cat.id === targetCategory.id);
			
			if (originalDragIndex === -1 || originalTargetIndex === -1) return;
			
			setCategories((prev) => {
				const next = [...prev];
				const [moved] = next.splice(originalDragIndex, 1);
				next.splice(originalTargetIndex, 0, moved);
				return next;
			});
			setDragIndex(null);
		};
	}

	function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
		// Reset visual feedback
		if (e.currentTarget) {
			e.currentTarget.style.opacity = '1';
		}
		setDragIndex(null);
	}

	return (
		<div className="min-h-screen relative">
			<div className="fixed inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
			<header className="border-b border-primary bg-layer-02/80 backdrop-blur shadow-layer-1">
				<div className="container-xl py-8 flex items-center justify-between">
					<div className="flex items-center gap-6">
						<div className="flex flex-col">
							<div className="text-2xl font-semibold text-white">Total Progress</div>
							<div className="text-2xl font-semibold text-white mt-1">{progress.done} / {progress.all}</div>
						</div>
						
						<div className="relative h-24 w-24">
							{/* Background circle */}
							<svg className="h-24 w-24 transform -rotate-90" viewBox="0 0 36 36">
								<circle
									cx="18"
									cy="18"
									r="16"
									fill="none"
									stroke="#6b7280"
									strokeWidth="2"
								/>
							</svg>
							{/* Progress circle */}
							<svg className="absolute top-0 left-0 h-24 w-24 transform -rotate-90" viewBox="0 0 36 36">
								<circle
									cx="18"
									cy="18"
									r="16"
									fill="none"
									stroke="#f97316"
									strokeWidth="2"
									strokeDasharray={`${progress.pct}, 100`}
									strokeLinecap="round"
								/>
							</svg>
							{/* Center content */}
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center">
									<div className="text-lg font-bold text-white">{progress.pct}%</div>
								</div>
							</div>
						</div>
					</div>
					<div className="flex gap-8">
						{/* Difficulty Progress Section */}
						<div className="flex gap-8">
							<div className="text-center">
								<div className="text-white font-semibold text-lg mb-1">Easy</div>
								<div className="text-sm text-gray-300 mb-3">
									{flattenProblems(categories).filter((p) => p.difficulty === 'Easy' && p.completed).length}
									/
									{flattenProblems(categories).filter((p) => p.difficulty === 'Easy').length} completed
								</div>
								<div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
									<div 
										className="h-full bg-green-500 rounded-full transition-all duration-300"
										style={{
											width: `${flattenProblems(categories).filter((p) => p.difficulty === 'Easy').length > 0 
												? (flattenProblems(categories).filter((p) => p.difficulty === 'Easy' && p.completed).length / 
													flattenProblems(categories).filter((p) => p.difficulty === 'Easy').length) * 100 
												: 0}%`
										}}
									></div>
								</div>
							</div>
							
							{/* Vertical divider */}
							<div className="w-px bg-gray-400 h-24 self-center"></div>
							
							<div className="text-center">
								<div className="text-white font-semibold text-lg mb-1">Medium</div>
								<div className="text-sm text-gray-300 mb-3">
									{flattenProblems(categories).filter((p) => p.difficulty === 'Medium' && p.completed).length}
									/
									{flattenProblems(categories).filter((p) => p.difficulty === 'Medium').length} completed
								</div>
								<div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
									<div 
										className="h-full bg-orange-500 rounded-full transition-all duration-300"
										style={{
											width: `${flattenProblems(categories).filter((p) => p.difficulty === 'Medium').length > 0 
												? (flattenProblems(categories).filter((p) => p.difficulty === 'Medium' && p.completed).length / 
													flattenProblems(categories).filter((p) => p.difficulty === 'Medium').length) * 100 
												: 0}%`
										}}
									></div>
								</div>
							</div>
							
							{/* Vertical divider */}
							<div className="w-px bg-gray-400 h-24 self-center"></div>
							
							<div className="text-center">
								<div className="text-white font-semibold text-lg mb-1">Hard</div>
								<div className="text-sm text-gray-300 mb-3">
									{flattenProblems(categories).filter((p) => p.difficulty === 'Hard' && p.completed).length}
									/
									{flattenProblems(categories).filter((p) => p.difficulty === 'Hard').length} completed
								</div>
								<div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
									<div 
										className="h-full bg-red-500 rounded-full transition-all duration-300"
										style={{
											width: `${flattenProblems(categories).filter((p) => p.difficulty === 'Hard').length > 0 
												? (flattenProblems(categories).filter((p) => p.difficulty === 'Hard' && p.completed).length / 
													flattenProblems(categories).filter((p) => p.difficulty === 'Hard').length) * 100 
												: 0}%`
										}}
									></div>
								</div>
							</div>
						</div>
						
						{/* Connection Status */}
						<div className="flex items-center gap-2">
							<div className={`w-2 h-2 rounded-full ${
								connectionStatus === 'connected' ? 'bg-green-500' : 
								connectionStatus === 'disconnected' ? 'bg-yellow-500' : 'bg-red-500'
							}`}></div>
							<span className="text-sm text-gray-300">
								{connectionStatus === 'connected' ? 'Connected' : 
								 connectionStatus === 'disconnected' ? 'Offline' : 'Error'}
							</span>
						</div>
						
						{/* Authentication Section */}
						<div className="flex items-center gap-4">
							{isAuthenticated ? (
								<button
									onClick={() => signOut()}
									className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
								>
									Sign Out
								</button>
							) : (
								<button
									onClick={() => setShowAuthForm(true)}
									className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
								>
									Sign In
								</button>
							)}
						</div>
					</div>
				</div>
			</header>

			<Controls
				categories={categories}
				onCreateCategory={createCategory}
				onAddProblem={(cid, p) => addProblem(cid, p)}
				onSearch={setSearch}
				onFilterDifficulty={setFilterDifficulty}
				randomPick={randomPick}
				canEdit={!loading && isAuthenticated && isAdmin}
			/>

			<main className="container-xl mt-6 flex flex-col gap-4 pb-8">
				{filteredCategories.map((cat, index) => (
					<CategoryCard
						key={cat.id}
						category={cat}
						onDeleteCategory={() => deleteCategory(cat.id)}
						onUpdateProblem={(pid, updater) => updateProblem(cat.id, pid, updater)}
						onDeleteProblem={(pid) => deleteProblem(cat.id, pid)}
						onUpdateCategory={(updates) => updateCategory(cat.id, updates)}
						readOnly={!isAuthenticated || !isAdmin}
						progressReadOnly={!isAuthenticated}
						draggable={isAuthenticated && isAdmin}
						onDragStart={isAuthenticated && isAdmin ? handleDragStart(index) : undefined}
						onDragOver={isAuthenticated && isAdmin ? handleDragOver : undefined}
						onDrop={isAuthenticated && isAdmin ? handleDrop(index) : undefined}
						onDragEnd={isAuthenticated && isAdmin ? handleDragEnd : undefined}
					/>
				))}
			</main>
			
			{/* Sign In Modal */}
			{showAuthForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#00000080' }}>
					<div className="bg-layer-02 rounded-lg border border-primary shadow-layer-2 w-[min(90vw,500px)] p-6">
						<div className="text-center mb-6">
							<h2 className="text-2xl font-bold text-primary mb-2">
								{isSignUp ? 'Sign Up' : 'Sign In'} to Edit
							</h2>
							<p className="text-secondary text-sm">
								{isSignUp ? 'Create your account to start editing' : 'Enter your credentials to continue'}
							</p>
						</div>
						
						<div className="space-y-4">
							{/* Email and Password fields */}
							<input
								type="email"
								placeholder="your@email.com"
								value={authEmail}
								onChange={(e) => setAuthEmail(e.target.value)}
								required
								className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
							/>
							
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									placeholder="Password"
									value={authPassword}
									onChange={(e) => setAuthPassword(e.target.value)}
									required
									className="w-full px-3 py-2 pr-10 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:outline-none focus:ring-2 focus:ring-blue-60"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword ? (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
										</svg>
									) : (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									)}
								</button>
							</div>
							
							{/* Forgot Password button */}
							{!isSignUp && (
								<button
									onClick={async () => {
										if (!authEmail.trim()) {
											alert('Please enter your email address first');
											return;
										}
										const { error } = await resetPassword(authEmail.trim());
										if (error) {
											alert('Password reset failed: ' + error);
										} else {
											alert('Password reset email sent! Check your inbox.');
										}
									}}
									className="w-full px-3 py-2 text-sm text-blue-400 hover:text-blue-300 underline"
								>
									Forgot Password?
								</button>
							)}
							
							{/* Signup additional fields */}
							{isSignUp && (
								<>
									<input
										type="text"
										placeholder="Full Name *"
										value={signupData.name}
										onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
										required
										className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
									/>
									
									<input
										type="date"
										placeholder="Date of Birth *"
										value={signupData.dob}
										onChange={(e) => setSignupData(prev => ({ ...prev, dob: e.target.value }))}
										required
										className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
									/>
									
									<input
										type="text"
										placeholder="University/Institution *"
										value={signupData.university}
										onChange={(e) => setSignupData(prev => ({ ...prev, university: e.target.value }))}
										required
										className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
									/>
									
									<div className="grid grid-cols-3 gap-3">
										<input
											type="text"
											placeholder="City *"
											value={signupData.city}
											onChange={(e) => setSignupData(prev => ({ ...prev, city: e.target.value }))}
											required
											className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
										/>
										
										<input
											type="text"
											placeholder="State *"
											value={signupData.state}
											onChange={(e) => setSignupData(prev => ({ ...prev, state: e.target.value }))}
											required
											className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
										/>
										
										<input
											type="text"
											placeholder="Country *"
											value={signupData.country}
											onChange={(e) => setSignupData(prev => ({ ...prev, country: e.target.value }))}
											required
											className="w-full px-3 py-2 rounded-md border border-primary bg-layer-03 text-primary focus:outline-none focus:ring-2 focus:ring-blue-60"
										/>
									</div>
								</>
							)}
							
							{/* Action buttons */}
							<div className="flex gap-3">
								<button
									onClick={async () => {
										if (!authEmail.trim() || !authPassword.trim()) {
											alert('Please fill in all required fields');
											return;
										}
										
										if (isSignUp) {
											// Check if all signup fields are filled
											if (!signupData.name || !signupData.dob || !signupData.university || 
												!signupData.city || !signupData.state || !signupData.country) {
												alert('Please fill in all signup fields');
												return;
											}
											
											const { error } = await signUpWithEmail(authEmail.trim(), authPassword, signupData);
											if (error) {
												if (error.includes('already exists')) {
													alert('Account already exists! Switching to sign in mode.');
													setIsSignUp(false);
													// Keep the email and password for convenience
												} else {
													alert('Sign up failed: ' + error);
												}
											} else {
												alert('Account created successfully! You can now sign in.');
												setIsSignUp(false);
												setAuthEmail('');
												setAuthPassword('');
												setShowPassword(false);
												setSignupData({ name: '', dob: '', university: '', city: '', state: '', country: '' });
											}
										} else {
											console.log('Attempting sign in...');
											const { error } = await signInWithEmail(authEmail.trim(), authPassword);
											if (error) {
												console.log('Sign in error:', error);
												alert('Sign in failed: ' + error);
											} else {
												console.log('Sign in successful, checking auth status...');
												// Force check authentication status after successful sign-in
												const isAuthed = await getIsAuthenticated();
												console.log('Auth status after sign in:', isAuthed);
												setIsAuthenticated(isAuthed);
												
												setShowAuthForm(false);
												setAuthEmail('');
												setAuthPassword('');
												setShowPassword(false);
												
												// Reload data from Supabase after authentication
												if (isAuthed) {
													console.log('Loading data from Supabase...');
													const newData = await loadData();
													setCategories(newData);
												}
											}
										}
									}}
									className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
								>
									{isSignUp ? 'Create Account' : 'Sign In'}
								</button>
								
								<button
									onClick={() => {
										setIsSignUp(!isSignUp);
										setAuthEmail('');
										setAuthPassword('');
										setShowPassword(false);
										setSignupData({ name: '', dob: '', university: '', city: '', state: '', country: '' });
									}}
									className="px-4 py-2 bg-purple-400 hover:bg-purple-500 text-white border border-purple-500 rounded-md transition-colors"
								>
									{isSignUp ? 'Already have account? Sign In' : 'Need account? Sign Up'}
								</button>
							</div>
							
							<button
								onClick={() => {
									setShowAuthForm(false);
									setAuthEmail('');
									setAuthPassword('');
									setShowPassword(false);
									setSignupData({ name: '', dob: '', university: '', city: '', state: '', country: '' });
									setIsSignUp(false);
								}}
								className="w-full px-4 py-2 bg-layer-03 hover:bg-layer-02 text-secondary border border-primary rounded-md transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 