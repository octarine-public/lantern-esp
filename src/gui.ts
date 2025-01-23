import {
	Color,
	GUIInfo,
	ImageData,
	MathSDK,
	Rectangle,
	RendererSDK,
	Vector2,
	Vector3
} from "github.com/octarine-public/wrapper/index"

export class LanternGUI {
	private readonly texSize = 14
	private readonly texRecPos = new Rectangle()
	private readonly texVecSize = new Vector2()
	private readonly iconSize = this.texSize * 1.4
	private readonly iconRecPos = new Rectangle()
	private readonly iconVecSize = new Vector2()

	private readonly iconLock =
		"github.com/octarine-public/lantern-esp/scripts_files/icons/lock.svg"

	public Draw(
		position: Vector3,
		remainingTime: number,
		unitName: string,
		additionalSize: number,
		formatTime = false
	) {
		const w2s = RendererSDK.WorldToScreen(position)
		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}

		this.update(w2s, additionalSize)

		if (
			GUIInfo.Contains(this.texRecPos.pos1) ||
			GUIInfo.Contains(this.iconRecPos.pos1)
		) {
			return
		}

		this.drawIcon(unitName)

		let text = ""
		if (remainingTime > 60) {
			text = formatTime
				? MathSDK.FormatTime(remainingTime)
				: Math.ceil(remainingTime).toFixed()
		} else {
			text = remainingTime.toFixed(remainingTime < 2 ? 1 : 0)
		}

		RendererSDK.TextByFlags(text, this.texRecPos, Color.White)
	}

	private update(w2s: Vector2, additionalSize: number) {
		const texSize = this.texSize + additionalSize
		this.texVecSize.SetX(GUIInfo.ScaleWidth(texSize))
		this.texVecSize.SetY(GUIInfo.ScaleHeight(texSize))

		const w2sPos1 = w2s.Subtract(this.texVecSize.DivideScalar(2).FloorForThis())
		this.texRecPos.pos1.CopyFrom(w2sPos1)
		this.texRecPos.pos2.CopyFrom(w2sPos1.Add(this.texVecSize))

		/** =================================================================== */

		const iconSize = this.iconSize + additionalSize
		this.iconVecSize.SetX(GUIInfo.ScaleWidth(iconSize))
		this.iconVecSize.SetY(GUIInfo.ScaleHeight(iconSize))

		const w2sPos2 = w2s.Subtract(this.iconVecSize.DivideScalar(2).FloorForThis())

		this.iconRecPos.pos1.CopyFrom(w2sPos2)
		this.iconRecPos.pos2.CopyFrom(w2sPos2.Add(this.iconVecSize))
		this.iconRecPos.AddY(this.texRecPos.Height / 2 + this.iconRecPos.Height / 2)
	}

	private drawIcon(unitName: string) {
		const islantern = unitName.includes("lantern")
		const Image = islantern
			? this.iconLock
			: (ImageData.GetUnitTexture(unitName, true) ?? "")
		RendererSDK.Image(
			Image,
			this.iconRecPos.pos1,
			-1,
			this.iconRecPos.Size,
			islantern ? Color.Red : Color.White
		)
	}
}
