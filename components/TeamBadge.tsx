import Image from "next/image";
import type { Team } from "@/lib/dataSource/types";
import { koreanTeamName } from "@/lib/i18n";

interface Props {
  team: Team;
  size?: number;
  textHidden?: boolean;
  className?: string;
}

export function TeamBadge({ team, size = 20, textHidden, className }: Props) {
  const displayName = koreanTeamName(team.id, team.shortName ?? team.name);
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {team.crestUrl ? (
        <Image
          src={team.crestUrl}
          alt={displayName}
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
      {!textHidden && <span className="truncate">{displayName}</span>}
    </span>
  );
}
