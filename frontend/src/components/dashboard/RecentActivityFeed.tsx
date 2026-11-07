import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { ActivityLog } from '../../types/index.js';
import { Avatar } from '../common/Avatar.js';

interface RecentActivityFeedProps {
  activities: ActivityLog[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Team Activity
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Real-time stream</span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No recent activities logged.</p>
        ) : (
          activities.slice(0, 6).map((act) => (
            <div key={act._id} className="flex items-start gap-2.5 text-xs">
              <Avatar src={act.user?.avatar} name={act.user?.name || 'User'} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 dark:text-slate-200 leading-snug">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {act.user?.name}
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">{act.details}</span>
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {new Date(act.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
