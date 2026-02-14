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
			<svg
				width="110"
				height="128"
				viewBox="0 0 72 84"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Shield */}
				<path
					d="M36 4L8 18V40C8 58 20 72 36 80C52 72 64 58 64 40V18L36 4Z"
					fill="rgba(245,158,11,0.12)"
					stroke="#f59e0b"
					strokeWidth="3"
				/>
				{/* Checkmark */}
				<path
					d="M24 42L33 51L48 32"
					stroke="#f59e0b"
					strokeWidth="5"
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				/>
			</svg>
		</div>,
		{
			...size,
		},
	);
}
