// Every event page on the site, in one list.
//
// Each page already keeps its details in its own event.ts — this pulls those
// together so the trainer dashboard can offer them as app home-screen banners
// without anything being typed in twice. Adding a new event means creating the
// page folder as normal and adding one import here; it then shows up in the
// dashboard on its own.

import { EVENT as christmasDo } from './christmas-do/event'
import { EVENT as familyFunDay } from './family-fun-day/event'
import { EVENT as summerSplashdown } from './summer-splashdown/event'

// The fields every event page's event.ts is expected to carry. Pages are free
// to hold more than this (prices, deposits, age cutoffs) — that's their own
// business and nothing here reads it.
type EventPage = {
  slug: string
  name: string
  date: string
  isoDate: string
  time: string
  location: string
}

const PAGES: EventPage[] = [christmasDo, familyFunDay, summerSplashdown]

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://frontlinefitness.co.uk').replace(/\/$/, '')

export type EventPageSummary = {
  slug: string
  name: string
  /** How the date reads on the page, e.g. "Saturday 5 December 2026". */
  date: string
  isoDate: string
  time: string
  location: string
  /** Where the page lives on the site, as a path. */
  path: string
  /** The same, absolute — the app opens banners in the browser, so it needs the host. */
  url: string
  /** The page's hero photo, absolute for the same reason. */
  image: string
  /** True once the day itself has passed. */
  isPast: boolean
}

/** Hero images are named after the page, so there's nothing to keep in step. */
function heroImage(slug: string) {
  return `${SITE_URL}/images/${slug}.webp`
}

/**
 * Every event page, soonest first, with events that have been and gone at the
 * end. `today` is injectable so this stays testable and so a server render and
 * a client render can be handed the same day.
 */
export function listEventPages(today: Date = new Date()): EventPageSummary[] {
  const todayIso = today.toISOString().slice(0, 10)

  return PAGES.map(page => ({
    slug: page.slug,
    name: page.name,
    date: page.date,
    isoDate: page.isoDate,
    time: page.time,
    location: page.location,
    path: `/events/${page.slug}`,
    url: `${SITE_URL}/events/${page.slug}`,
    image: heroImage(page.slug),
    isPast: page.isoDate < todayIso,
  })).sort((a, b) => {
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1
    return a.isoDate.localeCompare(b.isoDate)
  })
}

export function findEventPage(slug: string, today?: Date): EventPageSummary | undefined {
  return listEventPages(today).find(e => e.slug === slug)
}
