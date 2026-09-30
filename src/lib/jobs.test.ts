import { describe, it, expect } from 'vitest';
import { filterJobsByTitle, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('filterJobsByTitle', () => {
    const jobs = [
        { slug: 'platform', title: 'Data Platform Engineer' },
        { slug: 'analyst', title: 'Financial Analyst' },
        { slug: 'frontend', title: 'Senior Frontend Engineer' },
    ];

    it('matches title substrings without regard to case', () => {
        expect(filterJobsByTitle(jobs, 'engineer').map((job) => job.slug)).toEqual([
            'platform',
            'frontend',
        ]);
    });

    it('trims whitespace from the query', () => {
        expect(filterJobsByTitle(jobs, '  FINANCIAL  ').map((job) => job.slug)).toEqual([
            'analyst',
        ]);
    });

    it('returns every job for empty and whitespace-only queries', () => {
        expect(filterJobsByTitle(jobs, '')).toEqual(jobs);
        expect(filterJobsByTitle(jobs, '   ')).toEqual(jobs);
    });

    it('returns no jobs when no title matches', () => {
        expect(filterJobsByTitle(jobs, 'scientist')).toEqual([]);
    });

    it('preserves matching jobs in their original order without mutating input', () => {
        const originalJobs = structuredClone(jobs);

        expect(filterJobsByTitle(jobs, 'engineer')).toEqual([
            { slug: 'platform', title: 'Data Platform Engineer' },
            { slug: 'frontend', title: 'Senior Frontend Engineer' },
        ]);
        expect(jobs).toEqual(originalJobs);
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
