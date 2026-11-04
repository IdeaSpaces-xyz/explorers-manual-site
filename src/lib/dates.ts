/** The date as the timeline shows it, in UTC so a build gives the same page anywhere. */
export const shortDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
