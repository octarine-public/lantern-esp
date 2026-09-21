import "./translations"

import { LanternManager } from "./manager"
import { MenuManager } from "./menu"

new (class CLanternESP {
	private readonly menu = new MenuManager()
	private readonly manager = new LanternManager(this.menu)
	private readonly stateName = "modifier_watcher_state"

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("UnitAnimation", this.UnitAnimation.bind(this))
		EventsSDK.on("ModifierCreated", this.ModifierChanged.bind(this))
		EventsSDK.on("ModifierChanged", this.ModifierChanged.bind(this))
		EventsSDK.on("ModifierRemoved", this.ModifierRemoved.bind(this))
		EventsSDK.on("EntityDestroyed", this.EntityDestroyed.bind(this))
		EventsSDK.on("UnitAbilityDataUpdated", this.UnitAbilityDataUpdated.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		this.menu.MenuChanged(() => this.manager.MenuChanged())
	}

	private get isInGameUI() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}
	private get isPostGame() {
		return (
			Dota2SDK.GameRules === undefined ||
			Dota2SDK.GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	protected Draw() {
		if (!this.isPostGame && this.isInGameUI) {
			this.manager.Draw()
		}
	}
	protected UnitAbilityDataUpdated() {
		this.manager.UnitAbilityDataUpdated()
	}
	protected ModifierChanged(modifier: Modifier) {
		const parent = modifier.Parent
		if (modifier.Name === this.stateName && parent instanceof Lantern) {
			this.manager.WatcherChanged(parent, modifier)
		}
	}
	protected ModifierRemoved(modifier: Modifier) {
		const parent = modifier.Parent
		if (modifier.Name === this.stateName && parent instanceof Lantern) {
			this.manager.WatcherRemoved(parent)
		}
	}
	protected UnitAnimation(
		npc: Nullable<Unit | FakeUnit>,
		_seq: number,
		_rate: number,
		_castPoint: number,
		_type: number,
		activity: number
	) {
		if (!(npc instanceof Hero || npc instanceof FakeUnit)) {
			return
		}

		if (activity === GameActivity.ACT_DOTA_GENERIC_CHANNEL_1) {
			this.manager.UnitAnimation(npc)
		}
	}
	protected EntityDestroyed(entity: Entity) {
		if (entity instanceof Lantern) {
			this.manager.EntityDestroyed(entity)
		}
		if (entity instanceof Hero && entity.IsIllusion) {
			this.manager.EntityDestroyed(entity)
		}
	}
	protected GameEnded() {
		this.manager.GameEnded()
	}
})()
