import { LanternIcons } from "./icons"

export class MenuManager {
	public readonly Tree: Menu.Node
	public readonly Size: Menu.Slider
	public readonly State: Menu.Toggle
	public readonly Fill: Menu.Toggle
	public readonly Radius: Menu.Toggle
	public readonly RadiusColor: Menu.ColorPicker
	public readonly FormatTime: Menu.Toggle

	private readonly visual = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.visual.AddNode(
			"Watchers",
			LanternIcons.Watcher,
			"Who captured a watcher and for how long,\nwith the enemy's vision circle around it"
		)
		this.Tree.SortNodes = false

		// the script's own switch rides the header of the page and gates it
		this.State = this.Tree.AddToggle("State", true)
		this.State.IconPath = LanternIcons.State
		this.Tree.HeaderControl = this.State
		this.Tree.Gate = this.State

		this.Radius = this.Tree.AddToggle("Vision radius", true, "Enemy vision radius")
		this.Radius.IconPath = LanternIcons.Radius
		this.Fill = this.Tree.AddToggle("Fill", true, "Fill radius insides color")
		this.Fill.IconPath = LanternIcons.Fill
		this.FormatTime = this.Tree.AddToggle(
			"Format time",
			true,
			"Show cooldown\nformat time (min:sec)"
		)
		this.FormatTime.IconPath = LanternIcons.FormatTime
		this.Size = this.Tree.AddSlider(
			"Additional size",
			4,
			0,
			18,
			1,
			"Additional timer size and hero image"
		)
		this.Size.IconPath = LanternIcons.Size
		this.RadiusColor = this.Tree.AddColorPicker("Radius color", Color.Red)
		this.RadiusColor.IconPath = LanternIcons.Color

		this.Fill.IsHidden = !this.Radius.value
		this.RadiusColor.IsHidden = !this.Radius.value
		this.Radius.OnValue(call => {
			this.Fill.IsHidden = !call.value
			this.RadiusColor.IsHidden = !call.value
		})
	}

	public MenuChanged(callback: () => void) {
		this.Size.OnValue(() => callback())
		this.State.OnValue(() => callback())
		this.Radius.OnValue(() => callback())
		this.Fill.OnValue(() => callback())
		this.FormatTime.OnValue(() => callback())
		this.RadiusColor.OnValue(() => callback())
	}
}
