import { ImageResponse } from "next/og";

export const size = {
	width: 32,
	height: 32,
};
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0a0a0a",
				borderRadius: "6px",
			}}
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 40 52"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<title>BallotZero</title>
				{/* Ballot box — the "0" */}
				<rect
					x="4"
					y="18"
					width="32"
					height="30"
					rx="11"
					fill="rgba(255,120,136,0.15)"
					stroke="#FF7888"
					strokeWidth="3"
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
					strokeWidth="2.5"
				/>
			</svg>
		</div>,
		{
			...size,
		},
	);
}
