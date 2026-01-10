import { Award, Flame, CheckCircle, Clock } from 'lucide-react';

export type BadgeType = 'first_session' | 'streak_3' | 'task_finisher' | 'focused_5h';

interface BadgeIconProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeConfig = {
  first_session: {
    icon: Award,
    label: 'First Session',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
  },
  streak_3: {
    icon: Flame,
    label: '3-Day Streak',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
  },
  task_finisher: {
    icon: CheckCircle,
    label: 'Task Finisher',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
  },
  focused_5h: {
    icon: Clock,
    label: '5h Focused',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
  },
};

export function BadgeIcon({ badge, size = 'sm', className = '' }: BadgeIconProps) {
  const config = badgeConfig[badge];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
      title={config.label}
    >
      <Icon className={sizeClasses[size]} />
    </span>
  );
}

interface BadgeListProps {
  badges: (BadgeType | string)[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
}

export function BadgeList({ badges, size = 'sm', maxVisible = 3 }: BadgeListProps) {
  if (!badges || badges.length === 0) return null;

  const validBadges = badges.filter((b): b is BadgeType => 
    ['first_session', 'streak_3', 'task_finisher', 'focused_5h'].includes(b as string)
  );
  
  if (validBadges.length === 0) return null;

  const visibleBadges = validBadges.slice(0, maxVisible);
  const remaining = validBadges.length - maxVisible;

  return (
    <div className="flex items-center gap-1">
      {visibleBadges.map((badge) => (
        <BadgeIcon key={badge} badge={badge} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground" title={`${remaining} more badges`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
