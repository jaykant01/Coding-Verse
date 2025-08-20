import { useState } from 'react';
import { DifficultyBadge, PlatformBadge } from './Badge';
import { Problem } from '../types';
import { ExternalLink, Trash2, Edit2, CheckSquare, Square, X } from 'lucide-react';

export interface ProblemRowProps {
	problem: Problem;
	onToggleComplete: (completed: boolean) => void;
	onDelete: () => void;
	onEdit: (updates: Partial<Problem>) => void;
	readOnly?: boolean; // catalog fields
	progressReadOnly?: boolean; // checkbox + notes
}

export function ProblemRow({ problem, onToggleComplete, onDelete, onEdit, readOnly, progressReadOnly }: ProblemRowProps) {
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(problem.title);
	const [url, setUrl] = useState(problem.url);
	const [platform, setPlatform] = useState(problem.platform);
	const [difficulty, setDifficulty] = useState(problem.difficulty);
	const [note, setNote] = useState(problem.note ?? '');
	const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
	const [noteDraft, setNoteDraft] = useState(problem.note ?? '');

	function openNoteModal() {
		setNoteDraft(problem.note ?? '');
		setIsNoteModalOpen(true);
	}

	function closeNoteModal() {
		setIsNoteModalOpen(false);
	}

	function handleNoteDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const value = e.target.value;
		const lines = value.split(/\r?\n/);
		if (lines.length <= 1000) {
			setNoteDraft(value);
		} else {
			setNoteDraft(lines.slice(0, 1000).join('\n'));
		}
	}

	// Reset form when editing starts
	function startEditing() {
		if (readOnly) return; // Prevent editing in read-only mode
		setTitle(problem.title);
		setUrl(problem.url);
		setPlatform(problem.platform);
		setDifficulty(problem.difficulty);
		setNote(problem.note ?? '');
		setEditing(true);
	}

	return (
		<tr className="border-b border-primary/20 hover:bg-layer-03/50 transition-colors">
			<td className="px-4 py-3">
				<button 
					onClick={() => {
						if (!progressReadOnly) {
							onToggleComplete(!problem.completed);
						}
					}} 
					className={`text-tertiary hover:text-primary transition-colors ${progressReadOnly ? 'opacity-50 cursor-not-allowed hover:text-tertiary' : ''}`}
					disabled={progressReadOnly}
					title={progressReadOnly ? 'Sign in to track progress' : (problem.completed ? 'Mark as incomplete' : 'Mark as complete')}
				>
					{problem.completed ? <CheckSquare size={18} /> : <Square size={18} />}
				</button>
			</td>
			<td className="px-4 py-3 w-full">
				{editing && !readOnly ? (
					<input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60" style={{ 
						backgroundColor: 'var(--layer-03)', 
						border: '1px solid var(--border-tertiary)',
						color: 'var(--text-primary)'
					}} />
				) : (
					<span className="text-primary font-medium">{problem.title}</span>
				)}
			</td>
			<td className="px-4 py-3 whitespace-nowrap">
				{editing && !readOnly ? (
					<select 
						value={platform} 
						onChange={(e) => setPlatform(e.target.value as any)} 
						className="rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-60"
						style={{ 
							backgroundColor: 'var(--layer-03)', 
							border: '1px solid var(--border-tertiary)',
							color: 'var(--text-primary)'
						}}
					>
						<option value="GFG">GFG</option>
						<option value="LeetCode">LeetCode</option>
						<option value="HackerRank">HackerRank</option>
						<option value="Codeforces">Codeforces</option>
					</select>
				) : (
					<PlatformBadge platform={problem.platform} />
				)}
			</td>
			<td className="px-4 py-3 whitespace-nowrap">
				{editing && !readOnly ? (
					<input value={url} onChange={(e) => setUrl(e.target.value)} className="w-64 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60" style={{ 
						backgroundColor: 'var(--layer-03)', 
						border: '1px solid var(--border-tertiary)',
						color: 'var(--text-primary)'
					}} />
				) : (
					<a href={problem.url} target="_blank" className="inline-flex items-center gap-2 text-blue-60 hover:text-blue-80 transition-colors font-medium">
						<ExternalLink size={16} /> Link
					</a>
				)}
			</td>
			<td className="px-4 py-3 whitespace-nowrap">
				{editing && !readOnly ? (
					<select 
						value={difficulty} 
						onChange={(e) => setDifficulty(e.target.value as any)} 
						className="rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-60"
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
				) : (
					<DifficultyBadge difficulty={problem.difficulty} />
				)}
			</td>
			<td className="px-4 py-3">
				<div className="flex items-center gap-2">
					{editing && !readOnly ? (
						<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note..." className="w-64 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60" style={{ 
							backgroundColor: 'var(--layer-03)', 
							border: '1px solid var(--border-tertiary)',
							color: 'var(--text-primary)'
						}} />
					) : null}
					<button
						title={problem.note ? 'Edit notes' : 'Add notes'}
						className={`transition-colors p-1.5 rounded-md hover:bg-layer-03 ${problem.note ? 'text-primary' : 'text-tertiary hover:text-primary'} ${progressReadOnly ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-tertiary' : ''}`}
						onClick={() => { if (!progressReadOnly) openNoteModal(); }}
					>
						{/* Notebook icon (inline SVG) */}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z"/>
							<path d="M7 4v16"/>
							<path d="M9.5 8H15"/>
							<path d="M9.5 12H15"/>
							<path d="M9.5 16H13"/>
						</svg>
					</button>
				</div>
				{isNoteModalOpen && (
					<div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#00000080' }}>
						<div className="bg-layer-02 rounded-lg border border-primary shadow-layer-2 w-[min(90vw,900px)] max-h-[85vh] flex flex-col">
							<div className="px-4 py-3 border-b border-primary flex items-center justify-between">
								<div className="text-primary font-semibold">Edit Notes</div>
								<button className="text-tertiary hover:text-primary p-1.5 rounded-md hover:bg-layer-03" onClick={closeNoteModal}>
									<X size={16} />
								</button>
							</div>
							<div className="p-4 overflow-auto">
								<textarea
									value={noteDraft}
									onChange={handleNoteDraftChange}
									rows={24}
									className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-60"
									style={{ backgroundColor: 'var(--layer-03)', border: '1px solid var(--border-tertiary)', color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
								/>
								<div className="mt-2 text-sm text-tertiary">
									{noteDraft.split(/\r?\n/).length} / 1000 lines
								</div>
							</div>
							<div className="px-4 py-3 border-t border-primary flex justify-end gap-3">
								<button className="px-3 py-1.5 rounded-md bg-layer-03 text-secondary hover:text-primary hover:bg-layer-02 border border-tertiary transition-colors" onClick={closeNoteModal}>Cancel</button>
								<button
									className="px-3 py-1.5 rounded-md text-xs font-medium"
									style={{ backgroundColor: 'var(--green-60)', color: 'var(--text-reverse)' }}
									onClick={() => {
										if (progressReadOnly) return;
										onEdit({ title, url, platform, difficulty, note: noteDraft });
										setNote(noteDraft);
										setIsNoteModalOpen(false);
										setEditing(false);
									}}
								>
									Save Notes
								</button>
							</div>
						</div>
					</div>
				)}
			</td>
			<td className="px-4 py-3">
				<div className="flex items-center gap-3 text-tertiary">
					{editing && !readOnly ? (
						<button
							className="px-3 py-1.5 bg-green-60 rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
							style={{ color: 'var(--text-reverse)' }}
							onClick={() => {
								onEdit({ title, url, platform, difficulty, note });
								setEditing(false);
							}}
						>
							Save
						</button>
					) : (
						<button 
							className={`hover:text-primary transition-colors p-1.5 rounded-md hover:bg-layer-03 ${readOnly ? 'opacity-50 cursor-not-allowed hover:text-tertiary hover:bg-transparent' : ''}`}
							onClick={() => { if (!readOnly) startEditing(); }}
							disabled={readOnly}
						>
							<Edit2 size={16} />
						</button>
					)}
					<button 
						className={`hover:text-red-60 transition-colors p-1.5 rounded-md hover:bg-red-10 ${readOnly ? 'opacity-50 cursor-not-allowed hover:text-tertiary hover:bg-transparent' : ''}`}
						onClick={() => { if (!readOnly) onDelete(); }}
						disabled={readOnly}
					>
						<Trash2 size={16} />
					</button>
				</div>
			</td>
		</tr>
	);
} 