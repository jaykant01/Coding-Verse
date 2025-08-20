import { Category, Difficulty, Platform, Problem } from './types';

export function generateId(prefix: string = 'id'): string {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function countCompleted(problems: Problem[]): number {
	return problems.filter((p) => p.completed).length;
}

export function flattenProblems(categories: Category[]): Problem[] {
	return categories.flatMap((c) => c.problems);
}

export function difficultyOrder(d: Difficulty): number {
	switch (d) {
		case 'Easy':
			return 0;
		case 'Medium':
			return 1;
		case 'Hard':
			return 2;
	}
}

export function platformLabel(p: Platform): string {
	return p === 'GFG' ? 'GfG' : 'LeetCode';
} 