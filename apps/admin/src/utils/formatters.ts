export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
export const formatDateTime = (value: string) => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export const formatDate = (value: string) => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long' }).format(new Date(`${value}T12:00:00+02:00`));
