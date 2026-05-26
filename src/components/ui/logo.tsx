import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  priority?: boolean;
  className?: string;
};

const SIZES: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
  "2xl": 192,
};

export function Logo({ href, size = "md", priority, className }: LogoProps) {
  const px = SIZES[size];
  const img = (
    <Image
      src="/logo.svg"
      alt="MecaConnect"
      width={px}
      height={px}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="MecaConnect">
        {img}
      </Link>
    );
  }
  return img;
}
