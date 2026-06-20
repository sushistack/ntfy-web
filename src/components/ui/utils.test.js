import { describe, it, expect } from 'vitest';
import { cn } from './utils.js';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('handles conditional objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('returns empty string when no inputs', () => {
    expect(cn()).toBe('');
  });
});
