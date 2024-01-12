import { ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly Tree: Menu.Node
	public readonly Size: Menu.Slider
	public readonly State: Menu.Toggle

	private readonly visual = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.visual.AddNode(
			"Watchers",
			ImageData.Paths.AbilityIcons + "/watcher_channel_png.vtex_c"
		)

		this.State = this.Tree.AddToggle("State", true)
		this.Size = this.Tree.AddSlider(
			"Additional size",
			0,
			0,
			18,
			1,
			"Additional timer size and hero image"
		)
	}
}
