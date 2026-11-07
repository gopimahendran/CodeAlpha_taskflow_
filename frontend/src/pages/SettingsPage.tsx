import React, { useState } from 'react';
import {
  Settings,
  Building,
  Moon,
  Sun,
  RotateCcw,
  Shield,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../services/api.js';
import { Button } from '../components/common/Button.js';

export const SettingsPage: React.FC = () => {
  const { currentWorkspace, refreshWorkspaces, refreshProjects, refreshMembers } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [wsDesc, setWsDesc] = useState(currentWorkspace?.description || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    try {
      await api.updateWorkspace(currentWorkspace._id, {
        name: wsName,
        description: wsDesc,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      refreshWorkspaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset database to default sample projects, team members, tasks, and comments?')) {
      setIsResetting(true);
      setResetMessage('');
      try {
        const res = await api.resetSeed();
        setResetMessage(res.message);
        setTimeout(() => setResetMessage(''), 4000);
        await Promise.all([refreshWorkspaces(), refreshProjects(), refreshMembers()]);
      } catch (err: any) {
        setResetMessage(err.message || 'Failed to reset data');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure preferences, visual theme, and demo environment settings.
        </p>
      </div>

      {/* Workspace Profile */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Workspace Details
          </h2>
        </div>

        <form onSubmit={handleSaveWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={wsDesc}
              onChange={(e) => setWsDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </span>
            ) : (
              <span />
            )}
            <Button type="submit" variant="primary" size="sm">
              Update Workspace
            </Button>
          </div>
        </form>
      </div>

      {/* Appearance Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Visual Theme Mode
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch between gentle off-white light mode and high-contrast dark mode.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            leftIcon={
              theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )
            }
          >
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </Button>
        </div>
      </div>

      {/* Demo Data Reset Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200/60 dark:border-rose-950/40 shadow-xs">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Sample Demo Data
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Restores default realistic projects ("Mobile Banking App 3.0", "Design System"), realistic team members (Sarah, Alex, David, Elena, Maya), tasks across all columns, checklists, and active comments.
            </p>
          </div>
        </div>

        {resetMessage && (
          <div className="my-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {resetMessage}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleResetData}
            isLoading={isResetting}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Restore Default Sample Data
          </Button>
        </div>
      </div>
    </div>
  );
};
