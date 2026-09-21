import { WatcherPhase } from "./enums"
import { WorldChips } from "./gui/entity"
import { MenuManager } from "./menu"
import { LanternModel, WatcherTimings } from "./model"

export class LanternManager {
	private readonly models: LanternModel[] = []
	private readonly pSDK = new ParticlesSDK()
	private readonly timings = new WatcherTimings()
	private readonly lastAnimation: [Hero | FakeUnit, number][] = []

	constructor(private readonly menu: MenuManager) {}

	public Draw() {
		for (let i = this.models.length - 1; i > -1; i--) {
			const model = this.models[i]
			if (model.RadiusDrawn && !model.IsEnemyActive) {
				this.updateRadius(model)
			}
			model.Draw(this.menu)
		}
		if (!this.menu.State.value) {
			WorldChips.Reset()
			return
		}
		WorldChips.End(this.menu)
	}
	/** The game networked the watcher's state, freshly or changed. */
	public WatcherChanged(lantern: Lantern, modifier: Modifier) {
		const model = this.modelOf(lantern),
			channel = this.lastAnimation.find(x => x[1] >= GameState.RawGameTime),
			seenStart = channel !== undefined || model.Tracked
		model.Tracked = true
		const changed = model.Sync(
			modifier.NetworkArmor as WatcherPhase,
			modifier.NetworkAttackSpeed as Team,
			channel?.[0].Name,
			seenStart
		)
		if (changed) {
			this.updateRadius(model)
		}
	}
	/** The game stopped networking the watcher's state: what it does now goes unseen. */
	public WatcherRemoved(lantern: Lantern) {
		const model = this.models.find(x => x.EntityIndex === lantern.Index)
		if (model !== undefined) {
			model.Tracked = false
		}
	}
	public UnitAnimation(hero: Hero | FakeUnit) {
		if (this.timings.Channel === 0) {
			return
		}
		const tick = GameState.TickInterval
		const time = GameState.RawGameTime + this.timings.Channel + tick * 3
		const find = this.lastAnimation.find(x => x[0] === hero)
		if (find !== undefined) {
			find[1] = time
			return
		}
		this.lastAnimation.push([hero, time])
	}
	public EntityDestroyed(entity: Hero | Lantern) {
		if (entity instanceof Hero) {
			this.lastAnimation.removeCallback(
				(x: [Hero | FakeUnit, number]) => x[0] === entity
			)
		}
		if (entity instanceof Lantern) {
			this.pSDK.DestroyByKey(this.getKeyName(entity))
			this.removeModel(entity)
		}
	}
	public UnitAbilityDataUpdated() {
		const abilData = AbilityData.GetAbilityByName("ability_lamp_use")
		if (abilData === undefined) {
			return
		}
		this.timings.Channel = abilData.GetChannelTime(1)
		this.timings.Inactive = abilData.GetSpecialValue("inactive_duration", 1)
		this.timings.Active = abilData.GetSpecialValue("active_duration", 1)
	}
	public MenuChanged() {
		for (let i = this.models.length - 1; i > -1; i--) {
			this.updateRadius(this.models[i])
		}
	}
	public GameEnded() {
		for (let i = this.models.length - 1; i > -1; i--) {
			this.models[i].Destroy()
		}
		this.models.clear()
		WorldChips.Reset()
		this.pSDK.DestroyAll()
		this.lastAnimation.clear()
	}
	private getKeyName(entity: Lantern) {
		return `${entity.Index}_${entity.Name}`
	}
	private updateRadius(model: LanternModel) {
		const lantern = model.Entity,
			state = this.menu.State.value && this.menu.Radius.value
		if (lantern === undefined || !state || !model.IsEnemyActive) {
			this.pSDK.DestroyByKey(model.Key)
			model.RadiusDrawn = false
			return
		}
		this.pSDK.DrawCircle(model.Key, lantern, lantern.VisionRange, {
			Fill: this.menu.Fill.value,
			Color: this.menu.RadiusColor.SelectedColor,
			Attachment: ParticleAttachment.PATTACH_ABSORIGIN_FOLLOW
		})
		model.RadiusDrawn = true
	}
	/** The model of this watcher, made where none stands yet. */
	private modelOf(entity: Lantern) {
		const find = this.models.find(x => x.EntityIndex === entity.Index)
		if (find !== undefined) {
			return find
		}
		if (this.timings.Active === 0) {
			this.UnitAbilityDataUpdated()
		}
		const model = new LanternModel(
			this.getKeyName(entity),
			entity.Index,
			this.timings
		)
		model.Position.CopyFrom(entity.Position).AddScalarZ(entity.HealthBarOffset)
		this.models.push(model)
		return model
	}
	private removeModel(entity: Lantern) {
		this.models.removeCallback(x => {
			if (x.EntityIndex !== entity.Index) {
				return false
			}
			x.Destroy()
			return true
		})
	}
}
