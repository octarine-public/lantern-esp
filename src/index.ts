import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	EventsSDK,
	GameRules,
	GameState,
	Modifier
} from "github.com/octarine-public/wrapper/index"

import { LanternGUI } from "./gui"
import { MenuManager } from "./menu"

const bootstrap = new (class CLanternESP {
	private readonly gui = new LanternGUI()
	private readonly menu = new MenuManager()

	private readonly modifiers: Modifier[] = []
	private readonly buffNames = ["modifier_lamp_on", "modifier_lamp_off"]

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
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameChanged())

EventsSDK.on("GameStarted", () => bootstrap.GameChanged())

EventsSDK.on("ModifierCreated", modifier => bootstrap.ModifierCreated(modifier))

EventsSDK.on("ModifierRemoved", modifier => bootstrap.ModifierRemoved(modifier))
