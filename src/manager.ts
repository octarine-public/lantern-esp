import {
	AbilityData,
	GameState,
	Hero,
	Lantern,
	modifierstate,
	ParticleAttachment,
	ParticlesSDK
} from "github.com/octarine-public/wrapper/index"

import { GUI } from "./gui"
import { MenuManager } from "./menu"

export class LanternManager {
	private readonly gui: GUI[] = []
	private readonly pSDK = new ParticlesSDK()
	private readonly lastAnimation: [Hero, number][] = []

	private channelTime: number = 0
	private activeDuration: number = 0
	private inactiveDuration: number = 0

	constructor(private readonly menu: MenuManager) {}

	public Draw() {
		for (let i = this.gui.length - 1; i > -1; i--) {
			this.gui[i].Draw(this.menu)
		}
	}
	public UnitStateChanged(entity: Lantern) {
		const lastAnimation = this.lastAnimation.find(x => x[1] >= GameState.RawGameTime)
		if (!entity.IsUnitStateFlagSet(modifierstate.MODIFIER_STATE_PROVIDES_VISION)) {
			this.updateRadius(entity, true)
			this.updateGUIData(entity, lastAnimation, false)
			return
		}
		if (lastAnimation !== undefined) {
			this.updateRadius(entity, false, lastAnimation)
			this.updateGUIData(entity, lastAnimation, false, true)
		}
	}
	public UnitAnimation(hero: Hero) {
		if (this.channelTime === 0) {
			return
		}
		const tick = GameState.TickInterval
		const time = GameState.RawGameTime + this.channelTime + tick * 3
		const find = this.lastAnimation.find(x => x[0] === hero)
		if (find !== undefined) {
			find[1] = time
			return
		}
		this.lastAnimation.push([hero, time])
	}
	public EntityCreated(entity: Lantern) {
		this.updateRadius(entity)
	}
	public EntityDestroyed(entity: Hero | Lantern) {
		if (entity instanceof Hero) {
			this.lastAnimation.removeCallback((x: [Hero, number]) => x[0] === entity)
		}
		if (entity instanceof Lantern) {
			this.updateRadius(entity, true)
			this.updateGUIData(entity, undefined, true)
		}
	}
	public ParticleCreated(entity: Lantern) {
		const lastAnimation = this.lastAnimation.find(x => x[1] >= GameState.RawGameTime)
		if (lastAnimation === undefined || !lastAnimation[0].IsEnemy()) {
			return
		}
		const find = this.gui.find(x => x.KeyName === this.getKeyName(entity))
		if (find !== undefined) {
			find.UpdateProgressCapture(this.channelTime, lastAnimation[0].Name)
		}
	}
	public UnitAbilityDataUpdated() {
		const abilData = AbilityData.GetAbilityByName("ability_lamp_use")
		if (abilData === undefined) {
			return
		}
		this.channelTime = abilData.GetChannelTime(1)
		this.inactiveDuration = abilData.GetSpecialValue("inactive_duration", 1)
		this.activeDuration = abilData.GetSpecialValue("active_duration", 1)
	}
	private getKeyName(entity: Lantern) {
		return `${entity.Index}_${entity.Name}`
	}
	private updateRadius(
		lantern: Lantern,
		destroy = false,
		lastAnimation?: [Hero, number]
	) {
		const state = this.menu.State && this.menu.Radius.value
		const isProvidesVision = lantern.IsUnitStateFlagSet(
			modifierstate.MODIFIER_STATE_PROVIDES_VISION
		)
		const isEnemy = lastAnimation?.[0].IsEnemy() ?? false
		if (!state || destroy || !isProvidesVision || !isEnemy) {
			this.pSDK.DestroyByKey(this.getKeyName(lantern))
			return
		}
		this.pSDK.DrawCircle(this.getKeyName(lantern), lantern, lantern.Vision, {
			Fill: this.menu.Fill.value,
			Color: this.menu.RadiusColor.SelectedColor,
			Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW
		})
	}
	private updateGUIData(
		entity: Lantern,
		lastAnimation: Nullable<[Hero, number]>,
		destroy = false,
		isActive = false
	) {
		const keyName = this.getKeyName(entity)
		if (destroy) {
			this.gui.removeCallback(x => x.KeyName === keyName)
			return
		}
		const heroName = lastAnimation?.[0].Name
		const find = this.gui.find(x => x.KeyName === keyName)
		const position = entity.Position.Clone().AddScalarZ(entity.HealthBarOffset)
		if (find !== undefined) {
			find.UpdateData(heroName, isActive, position)
			return
		}
		const newClass = new GUI(keyName, this.activeDuration, this.inactiveDuration)
		newClass.UpdateData(heroName, isActive, position)
		this.gui.push(newClass)
	}
}
