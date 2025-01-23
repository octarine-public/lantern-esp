import {
	Color,
	ImageData,
	Menu,
	PathData
} from "github.com/octarine-public/wrapper/index"

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
			PathData.AbilityImagePath + "/watcher_channel_png.vtex_c"
		)
		this.Tree.SortNodes = false

		this.State = this.Tree.AddToggle("State", true)
		this.Radius = this.Tree.AddToggle("Vision radius", true, "Enemy vision radius")
		this.Fill = this.Tree.AddToggle("Fill", true, "Fill radius insides color")

		this.FormatTime = this.Tree.AddToggle(
			"Format time",
			true,
			"Show cooldown\nformat time (min:sec)",
			-1,
			ImageData.Icons.icon_svg_format_time
		)
		this.Size = this.Tree.AddSlider(
			"Additional size",
			4,
			0,
			18,
			1,
			"Additional timer size and hero image"
		)
		this.RadiusColor = this.Tree.AddColorPicker("Radius color", Color.Red)
		this.Radius.OnValue(call => {
			this.Fill.IsHidden = !call.value
			this.RadiusColor.IsHidden = !call.value
		})
	}

	public MenuChanged(callback: () => void) {
		this.Size.OnValue(() => callback())
		this.State.OnValue(() => callback())
		this.Radius.OnValue(() => callback())
		this.FormatTime.OnValue(() => callback())
		this.RadiusColor.OnValue(() => callback())
	}
}
