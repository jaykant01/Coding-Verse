import { useMemo, useState } from 'react';
import { Category, Difficulty, Platform, Problem } from '../types';
import { generateId } from '../utils';
import { Plus, Dice5, X } from 'lucide-react';

export interface ControlsProps {
	categories: Category[];
	onCreateCategory: (title: string) => void;
	onAddProblem: (categoryId: string, problem: Problem) => void;
	onSearch: (text: string) => void;
	onFilterDifficulty: (d?: Difficulty) => void;
	randomPick: () => void;
	canEdit?: boolean;
}

export function Controls(props: ControlsProps) {
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showProblemModal, setShowProblemModal] = useState(false);
	const [categoryTitle, setCategoryTitle] = useState('');
	const [newProblem, setNewProblem] = useState({
		title: '',
		url: '',
		platform: 'GFG' as Platform,
		difficulty: 'Easy' as Difficulty,
		categoryId: '',
	});

	const categoryOptions = useMemo(
		() => props.categories.map((c) => ({ value: c.id, label: c.title })),
		[props.categories]
	);

	const handleCreateCategory = () => {
		if (!categoryTitle.trim()) return;
		props.onCreateCategory(categoryTitle.trim());
		setCategoryTitle('');
		setShowCategoryModal(false);
	};

	const handleAddProblem = () => {
		if (!newProblem.title.trim() || !newProblem.url.trim() || !newProblem.categoryId) return;
		props.onAddProblem(newProblem.categoryId, {
			id: generateId('p'),
			title: newProblem.title.trim(),
			url: newProblem.url.trim(),
			platform: newProblem.platform,
			difficulty: newProblem.difficulty,
			completed: false,
		});
		setNewProblem({ title: '', url: '', platform: 'GFG', difficulty: 'Easy', categoryId: '' });
		setShowProblemModal(false);
	};

	const resetProblemForm = () => {
		setNewProblem({ title: '', url: '', platform: 'GFG', difficulty: 'Easy', categoryId: '' });
		setShowProblemModal(false);
	};

	return (
		<>
			<div className="container-xl mt-6">
				<div className="flex flex-wrap items-center gap-3">
					{/* Left Side - Add Buttons */}
					<button
						className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
						style={{ backgroundColor: 'var(--blue-60)', color: 'var(--text-reverse)' }}
						onClick={() => props.canEdit && setShowCategoryModal(true)}
						disabled={!props.canEdit}
					>
						<Plus size={16} /> Create Category
					</button>

					<button
						className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
						style={{ backgroundColor: 'var(--teal-60)', color: 'var(--text-reverse)' }}
						onClick={() => props.canEdit && setShowProblemModal(true)}
						disabled={!props.canEdit}
					>
						<Plus size={16} /> Add Problem
					</button>

					{/* Center - Search */}
					<input
						placeholder="Search problems..."
						className="rounded-md px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-60"
						style={{ 
							backgroundColor: 'var(--layer-02)', 
							border: '1px solid var(--border-secondary)',
							color: 'var(--text-primary)'
						}}
						onChange={(e) => props.onSearch(e.target.value)}
					/>

					{/* Right Side - Filter and Random */}
					<select
						defaultValue=""
						onChange={(e) => props.onFilterDifficulty((e.target.value || undefined) as Difficulty | undefined)}
						className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-60"
						style={{ 
							backgroundColor: 'var(--layer-02)', 
							border: '1px solid var(--border-secondary)',
							color: 'var(--text-primary)'
						}}
					>
						<option value="">Difficulty</option>
						<option>Easy</option>
						<option>Medium</option>
						<option>Hard</option>
					</select>

					<button
						className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
						style={{ backgroundColor: 'var(--purple-60)', color: 'var(--text-reverse)' }}
						onClick={props.randomPick}
					>
						<Dice5 size={16} /> Pick Random
					</button>
				</div>
			</div>

			{/* Category Creation Modal */}
			{showCategoryModal && (
				<div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--opacity-black-80)' }}>
					<div className="rounded-lg p-6 w-96 max-w-[90vw] border shadow-layer-2" style={{ 
						backgroundColor: 'var(--layer-02)', 
						borderColor: 'var(--border-secondary)' 
					}}>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-primary">Create New Category</h3>
							<button
								onClick={() => setShowCategoryModal(false)}
								className="text-tertiary hover:text-secondary transition-colors"
							>
								<X size={20} />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-secondary mb-2">
									Category Title
								</label>
								<input
									value={categoryTitle}
									onChange={(e) => setCategoryTitle(e.target.value)}
									placeholder="Enter category title"
									className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
									style={{ 
										backgroundColor: 'var(--layer-03)', 
										border: '1px solid var(--border-tertiary)',
										color: 'var(--text-primary)'
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleCreateCategory();
										}
									}}
									autoFocus
								/>
							</div>
							<div className="flex gap-2 justify-end">
								<button
									onClick={() => setShowCategoryModal(false)}
									className="px-4 py-2 text-sm font-medium border rounded-md hover:opacity-80 transition-opacity"
									style={{ 
										color: 'var(--text-secondary)', 
										borderColor: 'var(--border-tertiary)',
										backgroundColor: 'var(--layer-03)'
									}}
								>
									Cancel
								</button>
								<button
									onClick={handleCreateCategory}
									disabled={!categoryTitle.trim()}
									className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
									style={{ 
										backgroundColor: 'var(--blue-60)', 
										color: 'var(--text-reverse)' 
									}}
								>
									Create Category
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add Problem Modal */}
			{showProblemModal && (
				<div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--opacity-black-80)' }}>
					<div className="rounded-lg p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto border shadow-layer-2" style={{ 
						backgroundColor: 'var(--layer-02)', 
						borderColor: 'var(--border-secondary)' 
					}}>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-primary">Add New Problem</h3>
							<button
								onClick={resetProblemForm}
								className="text-tertiary hover:text-secondary transition-colors"
							>
								<X size={20} />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-secondary mb-2">
									Problem Title *
								</label>
								<input
									value={newProblem.title}
									onChange={(e) => setNewProblem((s) => ({ ...s, title: e.target.value }))}
									placeholder="Enter problem title"
									className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
									style={{ 
										backgroundColor: 'var(--layer-03)', 
										border: '1px solid var(--border-tertiary)',
										color: 'var(--text-primary)'
									}}
									autoFocus
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-secondary mb-2">
									Problem Link *
								</label>
								<input
									value={newProblem.url}
									onChange={(e) => setNewProblem((s) => ({ ...s, url: e.target.value }))}
									placeholder="https://leetcode.com/problems/..."
									className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
									style={{ 
										backgroundColor: 'var(--layer-03)', 
										border: '1px solid var(--border-tertiary)',
										color: 'var(--text-primary)'
									}}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-secondary mb-2">
										Platform *
									</label>
									<select
										value={newProblem.platform}
										onChange={(e) => setNewProblem((s) => ({ ...s, platform: e.target.value as Platform }))}
										className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
										style={{ 
											backgroundColor: 'var(--layer-03)', 
											border: '1px solid var(--border-tertiary)',
											color: 'var(--text-primary)'
										}}
									>
										<option value="GFG">GeeksforGeeks (GFG)</option>
										<option value="LeetCode">LeetCode</option>
										<option value="HackerRank">HackerRank</option>
										<option value="Codeforces">Codeforces</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-secondary mb-2">
										Difficulty *
									</label>
									<select
										value={newProblem.difficulty}
										onChange={(e) => setNewProblem((s) => ({ ...s, difficulty: e.target.value as Difficulty }))}
										className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
										style={{ 
											backgroundColor: 'var(--layer-03)', 
											border: '1px solid var(--border-tertiary)',
											color: 'var(--text-primary)'
										}}
									>
										<option value="Easy">Easy</option>
										<option value="Medium">Medium</option>
										<option value="Hard">Hard</option>
									</select>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-secondary mb-2">
									Category *
								</label>
								<select
									value={newProblem.categoryId}
									onChange={(e) => setNewProblem((s) => ({ ...s, categoryId: e.target.value }))}
									className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
									style={{ 
										backgroundColor: 'var(--layer-03)', 
										border: '1px solid var(--border-tertiary)',
										color: 'var(--text-primary)'
									}}
								>
									<option value="">Choose a category</option>
									{categoryOptions.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2 justify-end pt-2">
								<button
									onClick={resetProblemForm}
									className="px-4 py-2 text-sm font-medium border rounded-md hover:opacity-80 transition-opacity"
									style={{ 
										color: 'var(--text-secondary)', 
										borderColor: 'var(--border-tertiary)',
										backgroundColor: 'var(--layer-03)'
									}}
								>
									Cancel
								</button>
								<button
									onClick={handleAddProblem}
									disabled={!newProblem.title.trim() || !newProblem.url.trim() || !newProblem.categoryId}
									className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
									style={{ 
										backgroundColor: 'var(--teal-60)', 
										color: 'var(--text-reverse)' 
									}}
								>
									Add Problem
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
} 