import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { api } from '../services/api.js';
import { Task, ActivityLog } from '../types/index.js';
import { StatsCard } from '../components/dashboard/StatsCard.js';
import { TaskCompletionChart } from '../components/dashboard/TaskCompletionChart.js';
import { UpcomingDeadlines } from '../components/dashboard/UpcomingDeadlines.js';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed.js';
import { TaskModal } from '../components/kanban/TaskModal.js';
import { Button } from '../components/common/Button.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { currentWorkspace, projects } = useWorkspace();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!currentWorkspace) return;
    try {
      const [tasksData, activityData] = await Promise.all([
        api.getTasks({ workspaceId: currentWorkspace._id }),
        api.getActivity({ workspaceId: currentWorkspace._id }),
      ]);
      setTasks(tasksData);
      setActivities(activityData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentWorkspace?._id]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary via-indigo-600 to-primary-700 rounded-3xl p-6 md:p-8 text-white shadow-card relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-32 h-32 rounded-full bg-accent/20 blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent-200" />
            <span>Workspace: {currentWorkspace?.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Partner'} 👋
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-indigo-100 leading-relaxed font-sans">
            Here is your daily workspace snapshot. You have{' '}
            <span className="font-bold text-white underline decoration-accent decoration-2">
              {tasks.filter((t) => t.assignee?._id === user?._id && t.status !== 'done').length} personal tasks
            </span>{' '}
            in motion and {projects.length} active projects underway.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                if (projects.length > 0) {
                  navigate(`/projects/${projects[0]._id}`);
                } else {
                  navigate('/projects');
                }
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Kanban Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/my-tasks')}
              className="text-white border-white/40 hover:bg-white/15"
            >
              View My Tasks
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stats Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Projects"
          value={projects.length}
          subtitle="Flagship team workspaces"
          trend="+1 this month"
          icon={<FolderKanban className="w-5 h-5" />}
          color="#5B5BD6"
        />
        <StatsCard
          title="Total Tasks"
          value={totalTasks}
          subtitle="Across all sprint columns"
          trend="Balanced"
          icon={<Layers className="w-5 h-5" />}
          color="#20B8A6"
        />
        <StatsCard
          title="In Progress"
          value={inProgressTasks}
          subtitle="Active development"
          trend="On Track"
          icon={<Clock className="w-5 h-5" />}
          color="#F59E0B"
        />
        <StatsCard
          title="Completed Tasks"
          value={`${completedTasks}`}
          subtitle={`${completionPercent}% overall delivery`}
          trend={`${completionPercent}% velocity`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="#10B981"
        />
      </div>

      {/* Workflow Progress Chart */}
      <TaskCompletionChart tasks={tasks} />

      {/* Middle Row: Upcoming Deadlines + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines
          tasks={tasks}
          onTaskClick={(t) => {
            setSelectedTask(t);
            setIsTaskModalOpen(true);
          }}
        />
        <RecentActivityFeed activities={activities} />
      </div>

      {/* Active Projects Quick Access Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Active Projects
            </h3>
            <p className="text-xs text-slate-500">Jump straight to sprint kanban boards</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/projects')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            All Projects
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((proj) => {
            const pTasks = tasks.filter((t) => t.project === proj._id);
            const pCompleted = pTasks.filter((t) => t.status === 'done').length;
            const pPercent = pTasks.length === 0 ? 0 : Math.round((pCompleted / pTasks.length) * 100);

            return (
              <div
                key={proj._id}
                onClick={() => navigate(`/projects/${proj._id}`)}
                className="group p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-primary/50 hover:shadow-card cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: proj.color || '#5B5BD6' }}
                    />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {pTasks.length} tasks
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {proj.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold">{pPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${pPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTask?._id || null}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={(updated) => {
          setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t._id !== deletedId));
        }}
      />
    </div>
  );
};
