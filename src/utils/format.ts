export function parseDateDMY(dateStr: string): Date {
    if (!dateStr) throw new Error(`Invalid date: ${dateStr}`);
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}
