"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayerAvatar } from "./PlayerAvatar";

interface Props {
  name: string;
  photoUrl?: string;
  size?: number;
}

export function PlayerPhoto({ name, photoUrl, size = 40 }: Props) {
  const [errored, setErrored] = useState(false);
  if (!photoUrl || errored) {
    return <PlayerAvatar name={name} size={size} />;
  }
  return (
    <Image
      src={photoUrl}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0 bg-[var(--color-surface-2)]"
      onError={() => setErrored(true)}
    />
  );
}
