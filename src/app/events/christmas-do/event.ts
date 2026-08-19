// Single source of truth for the Christmas Do page, the checkout and the
// confirmation. Edit here to change what the page says.
export const EVENT = {
  slug: 'christmas-do',
  name: 'Christmas Do',
  date: 'Saturday 5 December 2026',
  // The same date, sortable — used to order the events list and to tell which
  // events have been and gone.
  isoDate: '2026-12-05',
  time: '19:00 till late',
  location: 'Bassett Down Golf Club, Royal Wootton Bassett',
  mapsQuery: 'Bassett+Down+Golf+Club+Royal+Wootton+Bassett',
  // Taken now to hold the place. The rest is settled closer to the night.
  deposit: 25,
  // What the night costs a head, all in — the venue's price with the card fees
  // on both payments covered. The balance is this less the deposit.
  total: 61.5,
}
