import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Building2, UserCheck } from "lucide-react";

export type BeneficiaryType = 'all' | 'citizen' | 'foreigner' | 'business';

interface BeneficiaryFilterProps {
  selected: BeneficiaryType;
  onChange: (type: BeneficiaryType) => void;
  counts?: {
    all: number;
    citizen: number;
    foreigner: number;
    business: number;
  };
}

const BENEFICIARY_OPTIONS: { type: BeneficiaryType; label: string; icon: typeof Users }[] = [
  { type: 'all', label: 'Tous', icon: Users },
  { type: 'citizen', label: 'Citoyens', icon: UserCheck },
  { type: 'foreigner', label: 'Étrangers', icon: Globe },
  { type: 'business', label: 'Entreprises', icon: Building2 },
];

export const BeneficiaryFilter = ({ selected, onChange, counts }: BeneficiaryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {BENEFICIARY_OPTIONS.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant={selected === type ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(type)}
          className="gap-2"
        >
          <Icon className="h-4 w-4" />
          {label}
          {counts && (
            <Badge 
              variant={selected === type ? "secondary" : "outline"} 
              className="ml-1 text-xs"
            >
              {counts[type]}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};
