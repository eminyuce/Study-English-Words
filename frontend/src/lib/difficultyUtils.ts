import { Difficulty, DifficultySelector } from '../backend';

/**
 * Convert DifficultySelector to Difficulty enum
 * Returns null for 'all' selector
 */
export function difficultySelectorToDifficulty(selector: DifficultySelector): Difficulty | null {
  switch (selector) {
    case 'beginner':
      return Difficulty.beginner;
    case 'medium':
      return Difficulty.medium;
    case 'hard':
      return Difficulty.hard;
    case 'advanced':
      return Difficulty.advanced;
    case 'all':
      return null;
    default:
      return null;
  }
}

/**
 * Get display label for difficulty
 */
export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.beginner:
      return 'Beginner';
    case Difficulty.medium:
      return 'Medium';
    case Difficulty.hard:
      return 'Hard';
    case Difficulty.advanced:
      return 'Advanced';
    default:
      return 'Unknown';
  }
}

/**
 * Get color class for difficulty badge
 */
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.beginner:
      return 'bg-green-500';
    case Difficulty.medium:
      return 'bg-yellow-500';
    case Difficulty.hard:
      return 'bg-orange-500';
    case Difficulty.advanced:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}
