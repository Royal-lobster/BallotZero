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
				overflow: "hidden",
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
						"radial-gradient(circle, rgba(245,158,11,0.06) 0%, rgba(16,185,129,0.04) 40%, transparent 70%)",
					transform: "translateX(-50%)",
					display: "flex",
				}}
			/>

			{/* Subtle grid lines */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
					backgroundSize: "60px 60px",
				}}
			/>

			{/* Top accent gradient bar */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "3px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 5%, #f59e0b 25%, #10b981 50%, #0ea5e9 75%, transparent 95%)",
				}}
			/>

			{/* Shield icon */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: "24px",
				}}
			>
				<svg
					width="72"
					height="84"
					viewBox="0 0 72 84"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					{/* Shield body */}
					<path
						d="M36 4L8 18V40C8 58 20 72 36 80C52 72 64 58 64 40V18L36 4Z"
						fill="rgba(245,158,11,0.08)"
						stroke="rgba(245,158,11,0.4)"
						strokeWidth="2"
					/>
					{/* Checkmark */}
					<path
						d="M26 42L33 49L46 34"
						stroke="#f59e0b"
						strokeWidth="3.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						fill="none"
					/>
				</svg>
			</div>

			{/* Wordmark */}
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
						color: "#f59e0b",
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
						border: "1px solid rgba(245,158,11,0.25)",
						background: "rgba(245,158,11,0.06)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#f59e0b",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#fbbf24" }}>
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
						border: "1px solid rgba(16,185,129,0.25)",
						background: "rgba(16,185,129,0.06)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#10b981",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#34d399" }}>Verifiable</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "8px 20px",
						borderRadius: "999px",
						border: "1px solid rgba(14,165,233,0.25)",
						background: "rgba(14,165,233,0.06)",
					}}
				>
					<div
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "50%",
							background: "#0ea5e9",
							display: "flex",
						}}
					/>
					<span style={{ fontSize: "15px", color: "#38bdf8" }}>Trustless</span>
				</div>
			</div>

			{/* Bottom accent gradient bar */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: "3px",
					display: "flex",
					background:
						"linear-gradient(90deg, transparent 5%, #0ea5e9 25%, #10b981 50%, #f59e0b 75%, transparent 95%)",
				}}
			/>
		</div>,
		{
			...size,
		},
	);
}
