import { Paths } from "./paths"

/** Outline glyphs of the menu and the overlay: the SDK set where it has one, our own otherwise. */
export const LanternIcons = {
	/** A watcher's lantern: the page itself. */
	Watcher: `${Paths.Icons}/watcher.svg`,
	State: Menu.Icons.Power,
	Radius: Menu.Icons.Radius,
	/** A ring with its inside filled: the tinted area of the vision circle. */
	Fill: `${Paths.Icons}/ring-fill.svg`,
	FormatTime: Menu.Icons.ClockSeconds,
	Size: Menu.Icons.Expand,
	Color: Menu.Icons.Palette,
	// overlay
	/** A watcher captured by the enemy and locked for the inactive time. */
	Lock: `${Paths.Icons}/lock.svg`,
	/** A watcher running for the enemy: how long its vision lasts. */
	Active: `${Paths.Icons}/timer.svg`
} as const
