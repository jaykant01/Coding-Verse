import { Category, Difficulty, Problem } from '../types';
import { countCompleted } from '../utils';
import { ChevronDown, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ProblemRow } from './ProblemRow';

export interface CategoryCardProps {
	category: Category;
	onDeleteCategory: () => void;
	onUpdateCategory: (updates: Partial<Category>) => void;
	onUpdateProblem: (problemId: string, updater: (p: Problem) => Problem) => void;
	onDeleteProblem: (problemId: string) => void;
	readOnly?: boolean;
	// Optional drag-and-drop props for reordering categories
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
	progressReadOnly?: boolean;
}

export function CategoryCard({ category, onDeleteCategory, onUpdateCategory, onUpdateProblem, onDeleteProblem, readOnly, draggable, onDragStart, onDragOver, onDrop, onDragEnd, progressReadOnly }: CategoryCardProps) {
	const [open, setOpen] = useState(true);
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(category.title);

	const total = category.problems.length;
	const done = countCompleted(category.problems);

	// Sort problems by difficulty: Easy → Medium → Hard
	const sortedProblems = useMemo(() => {
		const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 };
		return [...category.problems].sort((a, b) => {
			return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
		});
	}, [category.problems]);

	function startEditing() {
		setTitle(category.title);
		setEditing(true);
	}

	function saveEdit() {
		if (title.trim() && title !== category.title) {
			onUpdateCategory({ title: title.trim() });
		}
		setEditing(false);
	}

	function cancelEdit() {
		setTitle(category.title);
		setEditing(false);
	}

	return (
		<div 
			className="bg-layer-02 rounded-xl border border-primary overflow-hidden shadow-layer-1 transition-all duration-200" 
			draggable={draggable} 
			onDragStart={onDragStart} 
			onDragOver={onDragOver} 
			onDrop={onDrop}
			onDragEnd={onDragEnd}
			style={{
				cursor: draggable ? 'grab' : 'default'
			}}
		>
			<div className="w-full flex items-center justify-between px-6 py-4 hover:bg-layer-03 transition-colors">
				<div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setOpen((v) => !v)}>
					{open ? <ChevronDown size={18} className="text-tertiary" /> : <ChevronRight size={18} className="text-tertiary" />}
					{editing ? (
						<input 
							value={title} 
							onChange={(e) => setTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') saveEdit();
								if (e.key === 'Escape') cancelEdit();
							}}
							className="font-semibold text-primary text-lg bg-transparent border-b border-primary focus:outline-none focus:border-blue-60"
							onClick={(e) => e.stopPropagation()}
							autoFocus
						/>
					) : (
						<span className="font-semibold text-primary text-lg">{category.title}</span>
					)}
				</div>
				<div className="flex items-center gap-4">
					<div className="w-64 bg-layer-02 rounded-full h-3 overflow-hidden">
						{done > 0 && (
							<div 
								className="h-full transition-all duration-300 ease-out" 
								style={{ 
									width: `${Math.round((done / total) * 100)}%`,
									backgroundColor: 'var(--yellow-60)'
								}} 
							/>
						)}
					</div>
					<span className="text-sm text-secondary font-medium ml-2">{done} / {total}</span>
					<div className="flex items-center gap-2">
						{editing ? (
							<>
								<button 
									disabled={readOnly}
									onClick={(e) => { e.stopPropagation(); saveEdit(); }} 
									className="text-green-60 hover:text-green-80 transition-colors p-2 rounded-md hover:bg-green-10 disabled:opacity-50 disabled:cursor-not-allowed"
									title="Save changes"
								>
									✓
								</button>
								<button 
									onClick={(e) => { e.stopPropagation(); cancelEdit(); }} 
									className="text-tertiary hover:text-primary transition-colors p-2 rounded-md hover:bg-layer-03"
									title="Cancel edit"
								>
									✕
								</button>
							</>
						) : (
							<button 
								disabled={readOnly}
								onClick={(e) => { e.stopPropagation(); startEditing(); }} 
								className="text-blue-60 hover:text-blue-80 transition-colors p-2 rounded-md hover:bg-blue-10 disabled:opacity-50 disabled:cursor-not-allowed"
								title="Edit category"
							>
								<Edit2 size={16} />
							</button>
						)}
						<button disabled={readOnly} onClick={(e) => { e.stopPropagation(); onDeleteCategory(); }} className="text-red-60 hover:text-red-80 transition-colors p-2 rounded-md hover:bg-red-10 disabled:opacity-50 disabled:cursor-not-allowed">
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			</div>
			{open && (
				<div className="px-4 pb-6">
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="text-left text-secondary border-b border-primary">
								<tr>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium">Problem</th>
									<th className="px-4 py-3 font-medium">Platform</th>
									<th className="px-4 py-3 font-medium">Practice</th>
									<th className="px-4 py-3 font-medium">Difficulty</th>
									<th className="px-4 py-3 font-medium">Note</th>
									<th className="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{sortedProblems.map((p) => (
									<ProblemRow
										key={p.id}
										problem={p}
										onToggleComplete={(c) => onUpdateProblem(p.id, (old) => ({ ...old, completed: c }))}
										onDelete={() => onDeleteProblem(p.id)}
										onEdit={(updates) => onUpdateProblem(p.id, (old) => ({ ...old, ...updates }))}
										readOnly={readOnly}
										progressReadOnly={progressReadOnly}
									/>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
} 