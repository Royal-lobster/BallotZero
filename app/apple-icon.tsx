import { ImageResponse } from "next/og";

export const size = {
	width: 180,
	height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0a0a0a",
				borderRadius: "40px",
			}}
		>
			{/* biome-ignore lint/a11y/noSvgWithoutTitle: generated image, not DOM */}
			<svg
				width="85"
				height="106"
				viewBox="0 0 64 80"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Right/bottom arc */}
				<path
					d="M44.8 24.2 A17 24 0 0 1 23.2 60.5"
					stroke="#fafafa"
					strokeWidth="4.5"
					strokeLinecap="round"
					fill="none"
				/>
				{/* Left/top arc */}
				<path
					d="M19.2 55.8 A17 24 0 0 1 40.8 19.5"
					stroke="#fafafa"
					strokeWidth="4.5"
					strokeLinecap="round"
					fill="none"
				/>
				{/* Slash */}
				<line
					x1="16"
					y1="66"
					x2="48"
					y2="14"
					stroke="#fafafa"
					strokeWidth="4.5"
					strokeLinecap="round"
				/>
			</svg>
		</div>,
		{
			...size,
		},
	);
}
