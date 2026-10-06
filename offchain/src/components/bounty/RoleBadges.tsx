// Tags for the connected wallet's role on a bounty: "You organize", "You judge", "You won".

import { Badge } from "@/components/ui/badge";
import type { ViewerRoles } from "@/utils/roles";

interface Props {
  roles: ViewerRoles;
}

export default function RoleBadges({ roles }: Props) {
  const hasRole = roles.isOrganizer || roles.isJudge || roles.wonTiers.length > 0;
  if (!hasRole) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.isOrganizer && <Badge variant="secondary">You organize</Badge>}
      {roles.isJudge && <Badge variant="secondary">You judge</Badge>}
      {roles.wonTiers.length > 0 && (
        <Badge variant="outline" className="border-success/40 text-success">
          You won
        </Badge>
      )}
    </div>
  );
}
