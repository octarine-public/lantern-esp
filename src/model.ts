import { LanternState, WatcherPhase } from "./enums"
import { WorldChips } from "./gui/entity"
import { MenuManager } from "./menu"

/** What `ability_lamp_use` says about a watcher's lives, in seconds, read once the game has it. */
export class WatcherTimings {
	public Channel = 0
	public Active = 0
	public Inactive = 0
}

/**
 * What is known about one watcher: which life it is in and for whom, who put it there, when that
 * was seen to begin, and the channel that may be under way on it right now. Each frame it reports
 * itself to {@link WorldChips}, which draws the chip and keeps it through its dissolve.
 */
export class LanternModel {
	public Phase = WatcherPhase.Neutral
	public Team = Team.None
	public HeroName: Nullable<string>
	/** When the life was seen to begin, or -1 for a life already under way when first seen. */
	public Since = -1
	/** Whether the game is networking the watcher's state right now: a change seen is a change. */
	public Tracked = false
	/** Whether the vision circle stands on the map, so it can be taken down once the run is over. */
	public RadiusDrawn = false
	public readonly Position = new Vector3().Invalidate()

	private captureSince = -1
	private captureHeroName: Nullable<string>

	constructor(
		public readonly Key: string,
		public readonly EntityIndex: number,
		private readonly timings: WatcherTimings
	) {}

	public get Entity() {
		return EntityManager.EntityByIndex<Lantern>(this.EntityIndex)
	}
	public get IsEnemy() {
		return this.Team !== (LocalPlayer?.Team ?? Team.None)
	}
	/** Whether a team holds the watcher, contested or not. */
	public get IsHeld() {
		return this.Phase === WatcherPhase.Active || this.Phase === WatcherPhase.Contested
	}
	/** Whether the watcher is running for the enemy: what the circle and the minimap are for. */
	public get IsEnemyActive() {
		return this.IsHeld && this.IsEnemy && this.Remaining !== 0
	}
	/** Seconds the life has left, -1 when its start was not seen, 0 once it has run out. */
	public get Remaining() {
		if (this.Since < 0) {
			return -1
		}
		const duration = this.IsHeld ? this.timings.Active : this.timings.Inactive
		return Math.max(this.Since + duration - GameState.RawGameTime, 0)
	}
	public Draw(menu: MenuManager) {
		const now = GameState.RawGameTime,
			state = menu.State.value
		this.updateMiniMap(state)
		if (!state) {
			return
		}
		if (this.captureSince >= 0) {
			const left = this.captureSince + this.timings.Channel - now
			if (left > 0) {
				WorldChips.Progress(
					this.Key,
					this.Position,
					this.captureHeroName ?? "",
					left,
					this.timings.Channel
				)
			}
		}
		let state2: LanternState
		if (this.IsHeld) {
			state2 = LanternState.Active
		} else if (this.Phase === WatcherPhase.Off) {
			state2 = LanternState.Inactive
		} else {
			return
		}
		const time = this.Remaining
		if (time === 0) {
			return
		}
		WorldChips.Draw(this.Key, this.Position, time, state2, this.HeroName ?? "")
	}
	/**
	 * The watcher's state as the game networked it. A new phase or holder is a new life, counted
	 * from now when `seenStart` and from an unknown moment otherwise; a held watcher coming under
	 * contest, or out of it, stays in the life it was in. `heroName` is whoever was seen
	 * channelling as the change came: the taker, or the one turning the watcher off.
	 */
	public Sync(
		phase: WatcherPhase,
		team: Team,
		heroName: Nullable<string>,
		seenStart: boolean
	) {
		if (phase === this.Phase && team === this.Team) {
			return false
		}
		const held = phase === WatcherPhase.Active || phase === WatcherPhase.Contested,
			sameLife = held && this.IsHeld && team === this.Team
		this.Phase = phase
		this.Team = team
		if (!sameLife) {
			this.HeroName = heroName ?? this.captureHeroName
			this.Since = seenStart ? GameState.RawGameTime : -1
		}
		if (phase === WatcherPhase.Capturing || phase === WatcherPhase.Contested) {
			this.captureSince = GameState.RawGameTime
			this.captureHeroName = heroName
		} else {
			this.captureSince = -1
		}
		return true
	}
	/** The watcher is gone: nothing of it is left on the minimap. */
	public Destroy() {
		MinimapSDK.DeleteIcon(this.Key)
	}
	private updateMiniMap(state: boolean) {
		if (!state || !this.IsEnemyActive) {
			MinimapSDK.DeleteIcon(this.Key)
			return
		}
		MinimapSDK.DrawIcon("watcher", this.Position, 150, Color.Red, 0, this.Key)
	}
}
