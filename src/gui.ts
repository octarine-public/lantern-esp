import {
	Color,
	GameState,
	GUIInfo,
	ImageData,
	MathSDK,
	Rectangle,
	RendererSDK,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"

export class GUI {
	private static readonly basePath = "github.com/octarine-public/lantern-esp"
	private static readonly lock = this.basePath + "/scripts_files/icons/lock.svg"

	public IsActive = false
	public Inactive = false

	public LastUpdateTime: number
	public HeroName: Nullable<string>
	public readonly Position = new Vector3().Invalidate()

	private channelTime = 0
	private lastPorgressTime = 0
	private lastPorgressHeroName: Nullable<string>

	constructor(
		public readonly KeyName: string,
		private readonly activeDuration: number,
		private readonly inactiveDuration: number
	) {
		this.LastUpdateTime = GameState.RawGameTime
	}

	private get activeTime() {
		const time = GameState.RawGameTime
		return Math.max(this.LastUpdateTime + this.activeDuration - time, 0)
	}
	private get invactiveTime() {
		const time = GameState.RawGameTime
		return Math.max(this.LastUpdateTime + this.inactiveDuration - time, 0)
	}
	public Draw(menu: MenuManager) {
		if (!this.IsActive) {
			this.UpdateInactive()
		}
		if (!menu.State.value) {
			return
		}
		const w2s = RendererSDK.WorldToScreen(this.Position)
		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}
		let time = 0
		if (this.IsActive) {
			time = this.activeTime
		} else if (this.Inactive) {
			time = this.invactiveTime
		}
		const size = menu.Size.value + 12,
			scale = GUIInfo.ScaleVector(size, size),
			base = new Rectangle(w2s, w2s.Add(scale)).Subtract(scale.DivideScalar(3))
		if (time !== 0) {
			this.drawCapturedInfo(base, time, menu)
		}
		if (this.lastPorgressTime > GameState.RawGameTime) {
			this.drawProgress(base)
		}
	}
	public UpdateData(heroName: Nullable<string>, isActive: boolean, position: Vector3) {
		this.HeroName = heroName
		this.IsActive = isActive
		this.Position.CopyFrom(position)
		this.LastUpdateTime = GameState.RawGameTime
		this.Inactive = !this.IsActive && this.HeroName !== undefined
	}
	public UpdateProgressCapture(channelTime: number, heroName: string) {
		const tick = GameState.TickInterval
		this.channelTime = channelTime
		this.lastPorgressHeroName = heroName
		this.lastPorgressTime = GameState.RawGameTime + channelTime + tick * 2
	}
	protected UpdateInactive() {
		if (!this.Inactive) {
			return
		}
		const time = GameState.RawGameTime
		this.Inactive = time < this.LastUpdateTime + this.inactiveDuration
	}
	private drawProgress(base: Rectangle) {
		if (this.lastPorgressHeroName === undefined) {
			return
		}
		const position = base.Clone(),
			texture = ImageData.GetUnitTexture(this.lastPorgressHeroName)

		position.Width *= 2
		position.Height *= 2
		position.SubtractX(position.Width / 2)
		position.SubtractY(position.Height / 2)
		RendererSDK.Image(texture ?? "", position.pos1, 0, position.Size, Color.White)

		const rawTime = GameState.RawGameTime,
			time = Math.max(this.lastPorgressTime - rawTime, 0),
			arcTime = time / this.channelTime
		this.arc(-arcTime, position.pos1, position.Size, GUIInfo.ScaleHeight(4))
		RendererSDK.TextByFlags(`${time.toFixed(1)}`, position, Color.White, 2.66)
	}
	private drawCapturedInfo(base: Rectangle, time: number, menu: MenuManager) {
		const position = base.Clone()
		if (!this.Inactive) {
			position.SubtractY(position.Height * 3)
		}
		position.Width *= 2
		position.Height *= 1.2
		position.x -= base.Width / 2
		this.state(this.substrateWorld(position), this.Inactive ? Color.Red : Color.Green)
		this.imageLock(position, this.Inactive)
		this.imageHero(position)

		const text = menu.FormatTime.value
			? MathSDK.FormatTime(time)
			: time.toFixed(time > 1 ? 0 : 1)

		RendererSDK.TextByFlags(text, position, Color.White, 1.66)
	}
	private substrateWorld(rec: Rectangle) {
		const position = rec.Clone()
		position.x -= rec.Height
		position.Width += rec.Height * 2
		RendererSDK.RectRounded(
			position.pos1,
			position.Size,
			5,
			Color.Black.SetA(200),
			Color.Black,
			1
		)
		return position
	}
	private state(rec: Rectangle, color: Color) {
		const position = rec.Clone()
		position.Height /= 8
		position.SubtractY(position.Height / 2)

		RendererSDK.RectRounded(
			position.pos1,
			position.Size,
			5,
			color.SetA(180),
			Color.Black,
			1
		)
	}
	private imageLock(rec: Rectangle, isLocked: boolean) {
		const position = rec.Clone(),
			customSize = position.Height / 1.4,
			size = new Vector2(customSize, customSize),
			icon = isLocked ? GUI.lock : ImageData.Icons.icon_svg_time_fast,
			color = isLocked ? Color.Red : Color.Green

		position.x -= position.Height - position.Height / 6
		position.y += position.Height / 8
		RendererSDK.Image(icon, position.pos1, -1, size, color)
	}
	private imageHero(rec: Rectangle) {
		const heroName = this.HeroName
		if (heroName === undefined) {
			return
		}
		const position = rec.Clone()
		const startPos = position.pos1.AddScalarX(position.Width)
		const size = new Vector2(position.Height, position.Height)
		const imagePath = ImageData.GetUnitTexture(heroName, true)
		if (imagePath === undefined) {
			return
		}
		RendererSDK.Image(imagePath ?? "", startPos, -1, size, Color.White)
	}
	private arc(decimal: number, position: Vector2, size: Vector2, border = 5) {
		border = Math.round(border)
		const ratio = 100 * decimal
		const borderColor = new Color(0, 224, 7)
		if (ratio === 0) {
			RendererSDK.OutlinedCircle(position, size, Color.Red, border)
			return
		}
		RendererSDK.Arc(-90, 100, position, size, false, border, Color.Black)
		RendererSDK.Arc(-90, ratio, position, size, false, border, borderColor)
	}
}
