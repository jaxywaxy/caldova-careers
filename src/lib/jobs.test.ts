import { describe, it, expect } from 'vitest';
import {
    filterJobsByDepartment,
    filterJobsByQuery,
    formatPostedDate,
    getDashboardSummary,
    sortByNewest,
    sortJobs,
    summarizeDepartments,
} from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string, overrides: Partial<Job> = {}): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
        ...overrides,
    };
}

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

describe('filterJobsByQuery', () => {
    it('matches case-insensitive text and trims whitespace', () => {
        const jobs = [
            makeJob('a', '2027-01-01', { title: 'Senior Frontend Engineer', department: 'Technology' }),
            makeJob('b', '2027-02-01', { title: 'Clinical Data Analyst', department: 'Research' }),
        ];

        expect(filterJobsByQuery(jobs, '  front ').map((job) => job.slug)).toEqual(['a']);
        expect(filterJobsByQuery(jobs, 'research').map((job) => job.slug)).toEqual(['b']);
        expect(filterJobsByQuery(jobs, '   ').map((job) => job.slug)).toEqual(['a', 'b']);
    });
});

describe('filterJobsByDepartment', () => {
    it('matches departments without case sensitivity and preserves the original order', () => {
        const jobs = [
            makeJob('a', '2027-01-01', { department: 'Product' }),
            makeJob('b', '2027-02-01', { department: 'Research' }),
            makeJob('c', '2027-03-01', { department: 'Product' }),
        ];

        expect(filterJobsByDepartment(jobs, ' product ').map((job) => job.slug)).toEqual(['a', 'c']);
        expect(filterJobsByDepartment(jobs, 'all').map((job) => job.slug)).toEqual(['a', 'b', 'c']);
    });
});

describe('sortJobs', () => {
    it('orders by title and department when requested', () => {
        const jobs = [
            makeJob('b', '2027-01-01', { title: 'UX Researcher', department: 'Design' }),
            makeJob('a', '2027-02-01', { title: 'Data Engineer', department: 'Technology' }),
            makeJob('c', '2027-03-01', { title: 'Data Engineer', department: 'Research' }),
        ];

        expect(sortJobs(jobs, 'title').map((job) => job.slug)).toEqual(['c', 'a', 'b']);
        expect(sortJobs(jobs, 'department').map((job) => job.slug)).toEqual(['b', 'c', 'a']);
    });
});

describe('summarizeDepartments', () => {
    it('counts open roles per department and remote availability', () => {
        const jobs = [
            makeJob('a', '2027-01-01', { department: 'Technology', remote: true }),
            makeJob('b', '2027-02-01', { department: 'Technology', remote: false }),
            makeJob('c', '2027-03-01', { department: 'Research', remote: true }),
        ];

        expect(summarizeDepartments(jobs)).toEqual([
            { name: 'Technology', count: 2, remoteCount: 1 },
            { name: 'Research', count: 1, remoteCount: 1 },
        ]);
    });
});

describe('getDashboardSummary', () => {
    it('converts the job list into dashboard metrics', () => {
        const jobs = [
            makeJob('a', '2027-01-01', { department: 'Technology', location: 'Remote' }),
            makeJob('b', '2027-02-01', { department: 'Research', location: 'Boston, MA' }),
            makeJob('c', '2027-03-01', { department: 'Technology', location: 'Remote', remote: false }),
        ];

        expect(getDashboardSummary(jobs)).toEqual({
            totalRoles: 3,
            departments: 2,
            remoteRoles: 2,
            locations: 2,
        });
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
