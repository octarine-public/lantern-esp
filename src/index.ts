import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	FakeUnit,
	GameActivity,
	GameRules,
	GameState,
	Hero,
	Lantern,
	NetworkedParticle,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { LanternManager } from "./manager"
import { MenuManager } from "./menu"

new (class CLanternESP {
	private readonly menu = new MenuManager()
	private readonly manager = new LanternManager(this.menu)
	private readonly parName =
		"particles/econ/items/items_fx/lantern_of_sight_channeling.vpcf"

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("UnitAnimation", this.UnitAnimation.bind(this))
		EventsSDK.on("UnitStateChanged", this.UnitStateChanged.bind(this))
		EventsSDK.on("EntityDestroyed", this.EntityDestroyed.bind(this))
		EventsSDK.on("UnitAbilityDataUpdated", this.UnitAbilityDataUpdated.bind(this))
		EventsSDK.on("ParticleCreated", this.ParticleCreated.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
	}

	private get isInGameUI() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}
	private get isPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
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
	protected UnitStateChanged(entity: Unit) {
		if (entity instanceof Lantern) {
			this.manager.UnitStateChanged(entity)
		}
	}
	protected ParticleCreated(particle: NetworkedParticle) {
		if (particle.PathNoEcon !== this.parName) {
			return
		}
		if (particle.ModifiersAttachedTo instanceof Lantern) {
			this.manager.ParticleCreated(particle.ModifiersAttachedTo)
		}
	}
	protected UnitAnimation(
		npc: Unit | FakeUnit,
		_seq: number,
		_rate: number,
		_castPoint: number,
		_type: number,
		activity: number
	) {
		if (npc instanceof Hero && activity === GameActivity.ACT_DOTA_GENERIC_CHANNEL_1) {
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
