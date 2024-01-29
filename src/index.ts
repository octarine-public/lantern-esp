import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	Lantern,
	Modifier,
	ParticleAttachment,
	ParticlesSDK,
	Team
} from "github.com/octarine-public/wrapper/index"

import { LanternGUI } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CLanternESP {
	private readonly gui = new LanternGUI()
	private readonly menu = new MenuManager()
	private readonly pSDK = new ParticlesSDK()

	private readonly lanterns: Lantern[] = []
	private readonly modifiers: Modifier[] = []
	private readonly buffNames = ["modifier_lamp_on", "modifier_lamp_off"]

	constructor() {
		this.menu.MenuChanged(() => this.MenuChanged())
	}

	protected get IsPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}

	protected get IsInGameUI() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}

	public Draw() {
		if (!this.menu.State.value || this.IsPostGame || !this.IsInGameUI) {
			return
		}
		for (let index = this.modifiers.length - 1; index > -1; index--) {
			const modifier = this.modifiers[index]
			const owner = modifier.Parent
			const caster = modifier.Caster
			const remainingTime = modifier.RemainingTime
			if (!remainingTime || owner === undefined || caster === undefined) {
				continue
			}
			this.gui.Draw(
				owner.Position,
				remainingTime,
				caster.Name,
				this.menu.Size.value,
				this.menu.FormatTime.value
			)
		}
	}

	public EntityCreated(entity: Entity) {
		if (entity instanceof Lantern) {
			this.lanterns.push(entity)
			this.UpdateRadius(entity)
		}
	}

	public EntityDestroyed(entity: Entity) {
		if (entity instanceof Lantern) {
			this.lanterns.remove(entity)
			this.UpdateRadius(entity, true)
		}
	}

	public EntityTeamChanged(entity: Entity) {
		if (entity instanceof Lantern) {
			this.UpdateRadius(entity)
		}
	}

	public ModifierCreated(modifier: Modifier) {
		if (this.buffNames.includes(modifier.Name)) {
			this.modifiers.push(modifier)
		}
	}

	public ModifierRemoved(modifier: Modifier) {
		if (this.buffNames.includes(modifier.Name)) {
			this.modifiers.remove(modifier)
		}
	}

	public GameChanged() {
		this.menu.GameChanged()
	}

	protected UpdateRadius(lantern: Lantern, destroy = false) {
		const menu = this.menu
		const state = menu.State && menu.Radius.value
		const keyName = lantern.Name + "_" + lantern.Index
		if (!state || destroy || !lantern.IsEnemy() || lantern.Team === Team.Neutral) {
			this.pSDK.DestroyByKey(keyName)
			return
		}
		this.pSDK.DrawCircle(keyName, lantern, lantern.Vision, {
			Fill: menu.Fill.value,
			Color: menu.RadiusColor.SelectedColor,
			Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW
		})
	}

	protected MenuChanged() {
		for (let index = this.lanterns.length - 1; index > -1; index--) {
			this.UpdateRadius(this.lanterns[index])
		}
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("GameStarted", () => bootstrap.GameChanged())

EventsSDK.on("EntityCreated", entity => bootstrap.EntityCreated(entity))

EventsSDK.on("EntityDestroyed", entity => bootstrap.EntityDestroyed(entity))

EventsSDK.on("EntityTeamChanged", entity => bootstrap.EntityTeamChanged(entity))

EventsSDK.on("ModifierCreated", modifier => bootstrap.ModifierCreated(modifier))

EventsSDK.on("ModifierCreated", modifier => bootstrap.ModifierCreated(modifier))

EventsSDK.on("ModifierRemoved", modifier => bootstrap.ModifierRemoved(modifier))
