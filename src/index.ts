import "./translations"

import {
	Color,
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	Modifier,
	ParticlesSDK
} from "github.com/octarine-public/wrapper/index"

import { LanternGUI } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CLanternESP {
	private readonly gui = new LanternGUI()
	private readonly menu = new MenuManager()
	private readonly pSDK = new ParticlesSDK()

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

	public Tick() {
		/** @todo */
	}

	public ModifierCreated(modifier: Modifier) {
		if (this.buffNames.includes(modifier.Name)) {
			this.modifiers.push(modifier)
			this.UpdateRadius(modifier)
		}
	}

	public ModifierRemoved(modifier: Modifier) {
		if (this.buffNames.includes(modifier.Name)) {
			this.modifiers.remove(modifier)
			this.UpdateRadius(modifier)
		}
	}

	public EntityTeamChanged(entity: Entity) {
		// if (!(entity instanceof Lantern)) {
		// 	return
		// }
		// console.log("EntityTeamChanged", entity)
	}

	public EntityDestroyed(entity: Entity) {
		// if (!(entity instanceof Lantern)) {
		// 	return
		// }
		// console.log("EntityDestroyed", entity)
	}

	public GameChanged() {
		this.menu.GameChanged()
	}

	protected UpdateRadius(modifier: Modifier, destroy = false) {
		const owner = modifier.Parent
		const caster = modifier.Caster
		if (owner === undefined || caster === undefined) {
			return
		}
		const keyName = modifier.Name + "_" + owner.Index
		if (destroy || !this.menu.State.value) {
			this.pSDK.DestroyByKey(keyName)
			return
		}
		switch (modifier.Name) {
			case "modifier_lamp_on":
				this.pSDK.DrawCircle(keyName, owner, owner.Vision, {
					Color: caster.IsEnemy() ? Color.Red : Color.Green
				})
				break
			case "modifier_lamp_off":
				this.pSDK.DestroyByKey(keyName)
				break
		}
	}

	protected MenuChanged() {
		for (let index = this.modifiers.length - 1; index > -1; index--) {
			this.UpdateRadius(this.modifiers[index])
		}
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("Tick", () => bootstrap.Tick())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("GameStarted", () => bootstrap.GameChanged())

EventsSDK.on("ModifierCreated", modifier => bootstrap.ModifierCreated(modifier))

EventsSDK.on("ModifierRemoved", modifier => bootstrap.ModifierRemoved(modifier))

EventsSDK.on("EntityDestroyed", entity => bootstrap.EntityTeamChanged(entity))

EventsSDK.on("EntityTeamChanged", entity => bootstrap.EntityTeamChanged(entity))
