/** What a watcher is doing for its team: the glyph and the colour its chip wears. */
export const enum LanternState {
	/** Running for its team: how long its vision lasts. */
	Active,
	/** Turned off: locked for the inactive time before anyone can take it again. */
	Inactive
}

/**
 * Which life a watcher is in, as `modifier_watcher_state` networks it in its armor field. The
 * attack speed field beside it carries the team holding the watcher, and {@link Team.Shop} when
 * nobody does. Neither the modifier's duration nor its creation time moves with the state, so how
 * long a life has left is counted from the moment its start was seen.
 */
export const enum WatcherPhase {
	/** Turned off by the other team: locked for the inactive time before anyone can take it. */
	Off = 0,
	/** Nobody's: free to take. */
	Neutral = 1,
	/** Nobody's, with a channel under way on it. */
	Capturing = 2,
	/** Taken: running for its team for the active time. */
	Active = 3,
	/** Taken, with the other team channelling to turn it off. */
	Contested = 4
}
