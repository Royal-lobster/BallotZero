import Avatar from "boring-avatars";

export function AddressAvatar({
  address,
  size = "sm",
}: {
  address: string;
  size?: "sm" | "md";
}) {
  const px = size === "md" ? 32 : 20;
  return (
    <span className="inline-flex shrink-0">
      <Avatar name={address} size={px} variant="beam" />
    </span>
  );
}
