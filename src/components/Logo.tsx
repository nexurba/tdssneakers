import Image from "next/image";

/**
 * TDS SNEAKERS brand mark. The asset has a transparent background and a white
 * sticker outline, so it reads correctly on both light and dark surfaces.
 */
export default function Logo({
  className = "",
  width = 160,
  priority = false,
}: {
  className?: string;
  width?: number;
  priority?: boolean;
}) {
  // Source is 714x280 -> keep the aspect ratio.
  const height = Math.round((width * 280) / 714);
  return (
    <Image
      src="/logo.png"
      alt="TDS SNEAKERS"
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes={`${width}px`}
    />
  );
}
