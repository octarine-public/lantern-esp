import { LanternState } from "../enums"
import { LanternIcons } from "../icons"

/** The colour each state is known by: the glyph, the chip and the capture ring wear the same. */
const ActiveTint = new Color(96, 224, 128)
const InactiveTint = new Color(255, 96, 96)

export function LanternIcon(state: LanternState) {
	return state === LanternState.Inactive ? LanternIcons.Lock : LanternIcons.Active
}

export function LanternTint(state: LanternState) {
	return state === LanternState.Inactive ? InactiveTint : ActiveTint
}
