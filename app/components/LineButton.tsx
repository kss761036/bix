"use client";

import Link from "next/link";

type LineButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function LineButton({
  href,
  onClick,
  children,
}: LineButtonProps) {
  const className =
    "inline-flex h-9 cursor-pointer items-center rounded-md border border-[#2f2a24]/20 px-3 text-xs font-semibold text-[#161616] hover:border-[#2f2a24]/40";

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
