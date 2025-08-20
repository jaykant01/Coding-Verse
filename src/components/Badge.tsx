import { Difficulty, Platform } from '../types';

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
	const getDifficultyStyle = (difficulty: Difficulty) => {
		switch (difficulty) {
			case 'Easy':
				return {
					backgroundColor: '#0dbd8b',
					color: '#ffffff',
					border: '1px solid #008000'
				};
			case 'Medium':
				return {
					backgroundColor: '#ff9800',
					color: '#ffffff',
					border: '1px solid #f57c00'
				};
			case 'Hard':
				return {
					backgroundColor: '#ff1744',
					color: '#ffffff',
					border: '1px solid #d50000'
				};
		}
	};

	return (
		<span 
			className="px-2 py-0.5 rounded-full text-xs border inline-block"
			style={getDifficultyStyle(difficulty)}
		>
			{difficulty}
		</span>
	);
}

export function PlatformBadge({ platform }: { platform: Platform }) {
	const getPlatformStyle = (platform: Platform) => {
		switch (platform) {
			case 'GFG':
				return {
					backgroundColor: '#2f8d46',
					color: '#ffffff',
					border: '1px solid #1e5f2e'
				};
			case 'LeetCode':
				return {
					backgroundColor: '#ffa116',
					color: '#000000',
					border: '1px solid #e68a00'
				};
			case 'HackerRank':
				return {
					backgroundColor: '#00ea64',
					color: '#000000',
					border: '1px solid #00c854'
				};
			case 'Codeforces':
				return {
					backgroundColor: '#1f8ac0',
					color: '#ffffff',
					border: '1px solid #1569a0'
				};
		}
	};

	return (
		<span 
			className="px-2 py-0.5 rounded-full text-xs border inline-block"
			style={getPlatformStyle(platform)}
		>
			{platform}
		</span>
	);
} 