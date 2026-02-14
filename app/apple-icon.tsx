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
				width="100"
				height="100"
				viewBox="0 0 64 64"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Right/bottom arc */}
				<path
					d="M47.3 18.4 A19 23 0 0 1 19.4 49.2"
					stroke="#fafafa"
					strokeWidth="4.5"
					strokeLinecap="round"
					fill="none"
				/>
				{/* Left/top arc */}
				<path
					d="M16.7 45.6 A19 23 0 0 1 44.6 14.8"
					stroke="#fafafa"
					strokeWidth="4.5"
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
