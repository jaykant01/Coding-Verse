export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Platform = 'GFG' | 'LeetCode' | 'HackerRank' | 'Codeforces';

export interface Problem {
	id: string;
	title: string;
	url: string;
	platform: Platform;
	difficulty: Difficulty;
	completed: boolean;
	note?: string;
}

export interface Category {
	id: string;
	title: string;
	problems: Problem[];
} 