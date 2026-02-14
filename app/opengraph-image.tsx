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
			{/* Radial glow behind the content */}
			<div
				style={{
					position: "absolute",
					top: "-200px",
					left: "50%",
					width: "900px",
					height: "900px",
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(255,120,136,0.06) 0%, rgba(255,120,136,0.03) 40%, transparent 70%)",
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
					height: "3px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 10%, #FF7888 50%, transparent 90%)",
				}}
			/>

			{/* Ballot box logo */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: "24px",
				}}
			>
				<svg
					width="64"
					height="83"
					viewBox="0 0 40 52"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>BallotZero logo</title>
					{/* Ballot box — the "0" */}
					<rect
						x="4"
						y="18"
						width="32"
						height="30"
						rx="11"
						fill="rgba(255,120,136,0.08)"
						stroke="rgba(255,120,136,0.4)"
						strokeWidth="2"
					/>
					{/* Ballot paper dropping in */}
					<rect
						x="13"
						y="2"
						width="14"
						height="20"
						rx="2"
						transform="rotate(-8 20 12)"
						fill="#0a0a0a"
						stroke="#FF7888"
						strokeWidth="2"
					/>
				</svg>
			</div>

			{/* Title */}
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: "4px",
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
					Ballot
				</span>
				<span
					style={{
						fontSize: "72px",
						fontWeight: 700,
						color: "#FF7888",
						lineHeight: 1,
					}}
				>
					Zero
				</span>
			</div>

			{/* Tagline */}
			<div
				style={{
					display: "flex",
					fontSize: "22px",
					color: "#71717a",
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
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(255,255,255,0.04)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#FF7888",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#a1a1aa" }}>
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
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(255,255,255,0.04)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#FF7888",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#a1a1aa" }}>Verifiable</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 20px",
						borderRadius: "999px",
						border: "1px solid rgba(255,255,255,0.12)",
						background: "rgba(255,255,255,0.04)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#FF7888",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#a1a1aa" }}>Trustless</span>
				</div>
			</div>

			{/* Bottom accent line */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "3px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 10%, #FF7888 50%, transparent 90%)",
				}}
			/>
		</div>,
		{
			...size,
		},
	);
}
