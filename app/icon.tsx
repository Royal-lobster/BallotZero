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
				viewBox="-6 0 84 84"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Shield */}
				<path
					d="M36 4L8 18V40C8 58 20 72 36 80C52 72 64 58 64 40V18L36 4Z"
					fill="rgba(245,158,11,0.15)"
					stroke="#f59e0b"
					strokeWidth="4"
				/>
				{/* Checkmark */}
				<path
					d="M24 42L33 51L48 32"
					stroke="#f59e0b"
					strokeWidth="6"
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
