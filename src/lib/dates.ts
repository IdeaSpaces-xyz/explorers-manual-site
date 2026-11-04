/** The date as a reader says it, in UTC so a build gives the same page anywhere. */
export const longDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
