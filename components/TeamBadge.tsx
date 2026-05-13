import Image from "next/image";
import type { Team } from "@/lib/dataSource/types";

interface Props {
  team: Team;
  size?: number;
  textHidden?: boolean;
  className?: string;
}

export function TeamBadge({ team, size = 20, textHidden, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {team.crestUrl ? (
        <Image
          src={team.crestUrl}
          alt={team.name}
          width={size}
          height={size}
          className="shrink-0"
          unoptimized
        />
      ) : (
        <span
          className="inline-block bg-[var(--color-border)] rounded-full"
          style={{ width: size, height: size }}
          aria-hidden
        />
      )}
      {!textHidden && <span className="truncate">{team.shortName}</span>}
    </span>
  );
}
