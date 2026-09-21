import { LanternState } from "../enums"
import { MenuManager } from "../menu"
import { LanternIcon, LanternTint } from "./lanterns"

/**
 * The chip a watcher wears in the world, in dp at the slider's middle: the card the menu's own
 * panels wear - its glass, its hairline rim, its frost and its halo, whatever the theme set - washed
 * in the colour of the watcher's state, the glyph, the time left and the portrait of whoever put it
 * there. The slider scales the whole thing about {@link SIZE_BASE}.
 */
const HEIGHT = 24
/**
 * The corner, in dp: the menu's own card radius, which carries the theme's radius scale with it,
 * held to a pill so a wide radius on a low chip never turns its corners inside out.
 */
const RADIUS = Math.min(MenuSDK.HudCardRadius, HEIGHT / 2)
const PAD = 7
const GAP = 6
const GLYPH = 18
const PORTRAIT = 18
const PORTRAIT_RADIUS = 4
const FONT = 12
const WEIGHT = MenuSDK.HudBold
/** How deep the glass is washed in the tint over the theme's own colour, out of 255. */
const TINT = 36
/** How dark the outline under the time is cut, 0 to 1: enough to hold on a lit wall, not a black rim. */
const OUTLINE = 0.5
/** The slider value the chip is drawn at 1:1 on; every notch is a twelfth either way. */
const SIZE_BASE = 4
const SIZE_STEP = 12
const DIGIT = /\d/g
/**
 * The round timer a channel under way wears over the watcher: the portrait of whoever is
 * channelling, the channel left as a ring on its rim and the seconds over the middle, in dp at
 * the slider's middle, on the shadow a buff icon stands on.
 */
const TIMER = 40
const TIMER_SHADOW = 3

/**
 * How long a chip takes to come in, and how long it takes to dissolve once its watcher is done.
 * Going is the longer of the two: a watcher that ran out is worth a beat, where a chip arriving
 * should simply be there.
 */
const ENTER_MS = MenuSDK.Duration.Fade
const EXIT_MS = MenuSDK.Duration.Reveal
/** How far up a chip drifts at the far end of its dissolve, in dp. */
const DISSOLVE_LIFT = 6
/** How much of its size it keeps by then. */
const DISSOLVE_SCALE = 0.92
const CANVAS_PREFIX = "lantern-esp:"
/** What the channel timer's key carries after the watcher's own, so the two dissolve apart. */
const CAPTURE_SUFFIX = ":capture"

const enum ViewKind {
	Chip,
	Timer
}

/**
 * How much of a chip stands this frame, 0 to 1: it eases to 1 as the watcher is taken and back to
 * 0 once it is done, and the alpha, the lift and the size are all read off it. Turning around
 * midway carries on from where the value stood, so a watcher taken again never blinks.
 */
class Presence {
	public value = 0
	private from = 0
	private target = 0
	private since = -1

	public To(target: number, now: number) {
		if (target === this.target) {
			return
		}
		this.from = this.value
		this.target = target
		this.since = now
	}
	public Tick(now: number) {
		if (this.value === this.target) {
			return this.value
		}
		const rising = this.target > this.from,
			span = (rising ? ENTER_MS : EXIT_MS) / MenuSDK.AnimationSpeed(),
			at = Math.min((now - this.since) / span, 1)
		if (at >= 1) {
			this.value = this.target
			return this.value
		}
		const ease = MenuSDK.EaseValue(
			rising ? MenuSDK.Ease.Out : MenuSDK.Ease.Standard,
			at
		)
		this.value = this.from + (this.target - this.from) * ease
		return this.value
	}
}

/**
 * One watcher's chip, or the timer of a channel under way on it. It outlives the model it was
 * drawn from, which is what it takes to dissolve after the watcher is done, and it draws on a
 * surface of its own so it fades alone rather than with every chip on the map.
 */
class ChipView {
	public readonly position = new Vector3()
	public readonly life = new Presence()
	public readonly canvas: MenuSDK.Canvas
	/** The surface under the canvas, for the card the canvas has no call of its own for. */
	public readonly surface: MenuSDK.CHudSurface
	public time = 0
	public progress = 0
	public state = LanternState.Active
	public heroName = ""
	/** Whether the watcher this was drawn from reported itself this frame. */
	public seen = false

	constructor(
		public readonly Key: string,
		public readonly Kind: ViewKind
	) {
		const id = CANVAS_PREFIX + Key
		this.canvas = new MenuSDK.Canvas(id, MenuSDK.EPanelLayer.World)
		this.surface = MenuSDK.HudSurfaceOf(id, MenuSDK.EPanelLayer.World)
	}
	public Drop() {
		MenuSDK.DropHudSurface(CANVAS_PREFIX + this.Key)
	}
}

/**
 * Every chip standing in the world. The manager opens a frame, each held watcher reports itself,
 * and closing the frame draws them all: the ones reported at full presence, the ones that were
 * not on their way out.
 */
class WorldChipsRegistry {
	private readonly views: ChipView[] = []
	private readonly box = new Rectangle()
	private readonly pos = new Vector2()
	private readonly size = new Vector2()
	private readonly ink = new Color()
	private readonly white = new Color(255, 255, 255)
	private readonly glyphStyle: { color: Color } = { color: this.ink }
	private readonly portraitStyle: {
		color: Color
		radius: number
		fit: "cover"
	} = {
		color: this.white,
		radius: PORTRAIT_RADIUS,
		fit: "cover"
	}
	private readonly textStyle: {
		color: Color
		size: number
		weight: number
		effect: MenuSDK.EHudTextEffect
		effectOpacity: number
	} = {
		color: this.ink,
		size: FONT,
		weight: WEIGHT,
		effect: MenuSDK.EHudTextEffect.Outline,
		effectOpacity: OUTLINE
	}
	private readonly timerStyle: {
		texture: Nullable<string>
		progress: number
		color: Color
		shadow: number
		text: string
		opacity: number
	} = {
		texture: undefined,
		progress: 0,
		color: LanternTint(LanternState.Active),
		shadow: TIMER_SHADOW,
		text: "",
		opacity: 1
	}

	/** A held or locked watcher reporting itself for this frame. */
	public Draw(
		key: string,
		position: Vector3,
		time: number,
		state: LanternState,
		heroName: string
	) {
		const view = this.viewOf(key, ViewKind.Chip)
		view.position.CopyFrom(position)
		view.time = time
		view.state = state
		view.heroName = heroName
		view.seen = true
	}
	/** A channel under way on a watcher: `time` of the `total` channel is still to go. */
	public Progress(
		key: string,
		position: Vector3,
		heroName: string,
		time: number,
		total: number
	) {
		const view = this.viewOf(key + CAPTURE_SUFFIX, ViewKind.Timer)
		view.position.CopyFrom(position)
		view.time = time
		view.progress = total > 0 ? time / total : 0
		view.heroName = heroName
		view.seen = true
	}
	/** Draws every chip, the reported ones arriving or standing and the rest dissolving. */
	public End(menu: MenuManager) {
		const now = hrtime()
		for (let i = 0; i < this.views.length; i++) {
			const view = this.views[i]
			view.life.To(view.seen ? 1 : 0, now)
			const presence = view.life.Tick(now)
			if (!view.seen && presence <= 0) {
				view.Drop()
				this.views.splice(i--, 1)
				continue
			}
			view.seen = false
			this.draw(view, presence, menu)
		}
	}
	/** Takes every chip down at once, for a state that has no world to stand them in. */
	public Reset() {
		for (let i = this.views.length - 1; i > -1; i--) {
			this.views[i].Drop()
		}
		this.views.length = 0
	}

	private viewOf(key: string, kind: ViewKind) {
		for (const known of this.views) {
			if (known.Key === key) {
				return known
			}
		}
		const view = new ChipView(key, kind)
		this.views.push(view)
		return view
	}
	private draw(view: ChipView, presence: number, menu: MenuManager) {
		const w2s = RendererSDK.WorldToScreen(view.position)
		if (w2s === undefined || GUIInfo.Contains(w2s)) {
			return
		}
		const gone = 1 - presence,
			k = (menu.Size.value + SIZE_STEP) / (SIZE_BASE + SIZE_STEP),
			ks = k * (DISSOLVE_SCALE + (1 - DISSOLVE_SCALE) * presence),
			lift = GUIInfo.ScaleHeight(DISSOLVE_LIFT * k) * gone
		if (view.Kind === ViewKind.Timer) {
			this.drawTimer(view, w2s, ks, lift, presence)
			return
		}
		this.drawChip(view, w2s, ks, lift, presence, menu)
	}
	private drawChip(
		view: ChipView,
		w2s: Vector2,
		ks: number,
		lift: number,
		presence: number,
		menu: MenuManager
	) {
		const canvas = view.canvas,
			height = GUIInfo.ScaleHeight(HEIGHT * ks),
			pad = GUIInfo.ScaleWidth(PAD * ks),
			gap = GUIInfo.ScaleWidth(GAP * ks),
			glyph = GUIInfo.ScaleHeight(GLYPH * ks),
			hasTime = view.time >= 0,
			hasHero = view.heroName !== "",
			portrait = hasHero ? GUIInfo.ScaleHeight(PORTRAIT * ks) : 0,
			text = !hasTime
				? ""
				: menu.FormatTime.value
					? Math.formatTime(view.time)
					: view.time.toFixed(view.time > 1 ? 0 : 1)

		this.textStyle.size = GUIInfo.ScaleHeight(FONT * ks)
		const metric = text.replace(DIGIT, "0"),
			textW = hasTime ? MenuSDK.TextSize(metric, this.textStyle).x : 0,
			width = Math.round(
				pad +
					glyph +
					(hasTime ? gap + textW : 0) +
					(hasHero ? gap + portrait : 0) +
					pad
			),
			x = Math.round(w2s.x - width / 2),
			y = Math.round(w2s.y - height / 2 - lift),
			centerY = y + height / 2,
			tint = MenuSDK.HudColors.readable(LanternTint(view.state))

		this.ink.CopyFrom(tint).SetA(Math.round(255 * presence))
		this.white.SetA(Math.round(255 * presence))
		this.portraitStyle.radius = GUIInfo.ScaleHeight(PORTRAIT_RADIUS * ks)
		this.plate(view.surface, x, y, width, height, ks, tint, presence)

		let cursor = x + pad
		this.pos.SetVector(cursor, Math.round(centerY - glyph / 2))
		this.size.SetVector(glyph, glyph)
		canvas.Image(LanternIcon(view.state), this.pos, this.size, this.glyphStyle)
		cursor += glyph

		if (hasTime) {
			cursor += gap
			this.box.pos1.SetVector(cursor, y)
			this.box.pos2.SetVector(cursor + textW, y + height)
			canvas.TextIn(text, this.box, this.textStyle)
			cursor += textW
		}
		if (!hasHero) {
			return
		}
		cursor += gap
		this.pos.SetVector(cursor, Math.round(centerY - portrait / 2))
		this.size.SetVector(portrait, portrait)
		canvas.Image(
			ImageData.GetHeroTexture(view.heroName, true),
			this.pos,
			this.size,
			this.portraitStyle
		)
	}
	/**
	 * The plate under the chip: the menu's own card, so the glass, the rim, the blur and the halo are
	 * whatever the theme dresses its panels in, with the state's colour washed over the glass. The
	 * card is laid out at the world scale, so the menu's own scale does not resize it.
	 */
	private plate(
		surface: MenuSDK.CHudSurface,
		x: number,
		y: number,
		w: number,
		h: number,
		ks: number,
		tint: Color,
		presence: number
	) {
		MenuSDK.setHudWorldScale(ks)
		this.box.pos1.SetVector(x, y)
		this.box.pos2.SetVector(x + w, y + h)
		MenuSDK.SetActiveSurface(surface)
		try {
			MenuSDK.HudCard.Frame(this.box, Math.round(255 * presence), RADIUS)
			MenuSDK.HudCard.Plate(
				x,
				y,
				w,
				h,
				MenuSDK.hudRadius(RADIUS),
				tint,
				MenuSDK.hudAlpha(TINT)
			)
		} finally {
			MenuSDK.SetActiveSurface(undefined)
		}
	}
	private drawTimer(
		view: ChipView,
		w2s: Vector2,
		ks: number,
		lift: number,
		presence: number
	) {
		const size = Math.round(GUIInfo.ScaleHeight(TIMER * ks)),
			style = this.timerStyle
		style.texture =
			view.heroName === "" ? undefined : ImageData.GetHeroTexture(view.heroName)
		style.progress = view.progress
		style.text = view.time.toFixed(1)
		style.opacity = presence
		style.color = MenuSDK.HudColors.readable(LanternTint(LanternState.Active))
		this.pos.SetVector(
			Math.round(w2s.x - size / 2),
			Math.round(w2s.y - size / 2 - lift)
		)
		view.canvas.CircleTimer(this.pos, size, style)
	}
}

export const WorldChips = new WorldChipsRegistry()
