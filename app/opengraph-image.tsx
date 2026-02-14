import { ImageResponse } from "next/og";

export const alt = "BallotZero — Trustless, verifiable elections";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "#0a0a0a",
				position: "relative",
			}}
		>
			{/* Subtle radial glow */}
			<div
				style={{
					position: "absolute",
					top: "-200px",
					left: "50%",
					width: "900px",
					height: "900px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%)",
					transform: "translateX(-50%)",
					display: "flex",
				}}
			/>

			{/* Top accent line */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "2px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 15%, rgba(255,255,255,0.2) 50%, transparent 85%)",
				}}
			/>

			{/* Slashed zero mark */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: "28px",
				}}
			>
				{/* biome-ignore lint/a11y/noSvgWithoutTitle: generated image, not DOM */}
				<svg
					width="72"
					height="72"
					viewBox="0 0 64 64"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Right/bottom arc */}
					<path
						d="M47.3 18.4 A19 23 0 0 1 19.4 49.2"
						stroke="#fafafa"
						strokeWidth="4"
						strokeLinecap="round"
						fill="none"
					/>
					{/* Left/top arc */}
					<path
						d="M16.7 45.6 A19 23 0 0 1 44.6 14.8"
						stroke="#fafafa"
						strokeWidth="4"
						strokeLinecap="round"
						fill="none"
					/>
					{/* Slash */}
					<line
						x1="13"
						y1="53"
						x2="51"
						y2="11"
						stroke="#fafafa"
						strokeWidth="4"
						strokeLinecap="round"
					/>
				</svg>
			</div>

			{/* Title */}
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					letterSpacing: "-2px",
				}}
			>
				<span
					style={{
						fontSize: "72px",
						fontWeight: 700,
						color: "#fafafa",
						lineHeight: 1,
					}}
				>
					BallotZero
				</span>
			</div>

			{/* Tagline */}
			<div
				style={{
					display: "flex",
					fontSize: "22px",
					color: "#52525b",
					marginTop: "16px",
					letterSpacing: "0.5px",
				}}
			>
				Trustless, verifiable elections with homomorphic encryption
			</div>

			{/* Three pill badges */}
			<div
				style={{
					display: "flex",
					gap: "16px",
					marginTop: "36px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 20px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.1)",
					}}
				>
					<span style={{ fontSize: "15px", color: "#71717a" }}>
						Private Ballots
					</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 20px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.1)",
					}}
				>
					<span style={{ fontSize: "15px", color: "#71717a" }}>Verifiable</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 20px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.1)",
					}}
				>
					<span style={{ fontSize: "15px", color: "#71717a" }}>Trustless</span>
				</div>
			</div>

			{/* Bottom accent line */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "2px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 15%, rgba(255,255,255,0.2) 50%, transparent 85%)",
				}}
			/>
		</div>,
		{
			...size,
		},
	);
}
