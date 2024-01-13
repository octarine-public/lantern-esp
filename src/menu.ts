import {
	ImageData,
	Menu,
	NotificationsSDK,
	ResetSettingsUpdated,
	Sleeper
} from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly Tree: Menu.Node
	public readonly Size: Menu.Slider
	public readonly State: Menu.Toggle
	public readonly FormatTime: Menu.Toggle

	private readonly reset: Menu.Button
	private readonly sleeper = new Sleeper()
	private readonly visual = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.visual.AddNode(
			"Watchers",
			ImageData.Paths.AbilityIcons + "/watcher_channel_png.vtex_c"
		)

		this.State = this.Tree.AddToggle("State", true)

		this.FormatTime = this.Tree.AddToggle(
			"Format time",
			true,
			"Show cooldown\nformat time (min:sec)",
			-1,
			ImageData.Paths.Icons.icon_svg_format_time
		)

		this.Size = this.Tree.AddSlider(
			"Additional size",
			4,
			0,
			18,
			1,
			"Additional timer size and hero image"
		)

		this.reset = this.Tree.AddButton("Reset settings")
		this.reset.OnValue(() => this.ResetSettings())
	}

	public ResetSettings() {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		this.Size.value = this.Size.defaultValue
		this.State.value = this.State.defaultValue
		this.FormatTime.value = this.FormatTime.defaultValue
		this.sleeper.Sleep(2 * 1000, "ResetSettings")
		NotificationsSDK.Push(new ResetSettingsUpdated())
	}

	public GameChanged() {
		this.sleeper.FullReset()
	}

	public MenuChanged(callback: () => void) {
		this.Size.OnValue(() => callback())
		this.State.OnValue(() => callback())
		this.reset.OnValue(() => callback())
		this.FormatTime.OnValue(() => callback())
	}
}
