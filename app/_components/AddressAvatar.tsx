export function AddressAvatar({
  address,
  size = "sm",
}: {
  address: string;
  size?: "sm" | "md";
}) {
  const hex = address.replace(/^0x/, "").slice(0, 6);
  const bg = `#${hex}`;
  const label = address.replace(/^0x/, "").slice(0, 2).toUpperCase();
  const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-5 w-5 text-[10px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none text-white ${sizeClass}`}
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
