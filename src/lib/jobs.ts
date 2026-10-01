/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

export type JobSortOption = 'newest' | 'title' | 'department';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/** Filter jobs by a free-text query across core fields, trimming whitespace first. */
export function filterJobsByQuery(jobs: Job[], query: string): Job[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return jobs;
    }

    return jobs.filter((job) =>
        [job.title, job.department, job.location, job.summary].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
        ),
    );
}

/** Filter jobs by department, ignoring casing and matching only the provided value. */
export function filterJobsByDepartment(jobs: Job[], department: string): Job[] {
    const normalizedDepartment = department.trim().toLowerCase();
    if (!normalizedDepartment || normalizedDepartment === 'all') {
        return jobs;
    }

    return jobs.filter((job) => job.department.toLowerCase() === normalizedDepartment);
}

/** Sort jobs using a reusable department, title, or newest-first option. */
export function sortJobs(jobs: Job[], sortBy: JobSortOption = 'newest'): Job[] {
    const sortedJobs = [...jobs];

    switch (sortBy) {
        case 'title':
            return sortedJobs.sort(
                (a, b) => a.title.localeCompare(b.title) || a.department.localeCompare(b.department),
            );
        case 'department':
            return sortedJobs.sort(
                (a, b) => a.department.localeCompare(b.department) || a.title.localeCompare(b.title),
            );
        case 'newest':
        default:
            return sortByNewest(sortedJobs);
    }
}

export interface DepartmentSummary {
    name: string;
    count: number;
    remoteCount: number;
}

/** Aggregate a department snapshot for dashboard card summaries. */
export function summarizeDepartments(jobs: Job[]): DepartmentSummary[] {
    const totals = new Map<string, DepartmentSummary>();

    for (const job of jobs) {
        const existing = totals.get(job.department) ?? {
            name: job.department,
            count: 0,
            remoteCount: 0,
        };

        existing.count += 1;
        if (job.remote) {
            existing.remoteCount += 1;
        }

        totals.set(job.department, existing);
    }

    return [...totals.values()].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
}

export interface DashboardSummary {
    totalRoles: number;
    departments: number;
    remoteRoles: number;
    locations: number;
}

/** Compute the headline stats displayed on the careers dashboard. */
export function getDashboardSummary(jobs: Job[]): DashboardSummary {
    return {
        totalRoles: jobs.length,
        departments: new Set(jobs.map((job) => job.department)).size,
        remoteRoles: jobs.filter((job) => job.remote).length,
        locations: new Set(jobs.map((job) => job.location)).size,
    };
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
