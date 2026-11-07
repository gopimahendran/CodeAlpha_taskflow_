import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Users, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../services/api.js';
import { Project, Task } from '../types/index.js';
import { KanbanBoard } from '../components/kanban/KanbanBoard.js';
import { TaskModal } from '../components/kanban/TaskModal.js';
import { Button } from '../components/common/Button.js';
import { Avatar } from '../components/common/Avatar.js';

export const ProjectBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // URL query task modal open
  const urlTaskId = searchParams.get('task');

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  if (isLoading || !project) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="mt-2 text-xs text-slate-500">Loading project board...</p>
      </div>
    );
  }

  const ownerObj = typeof project.owner !== 'string' ? project.owner : null;

  return (
    <div className="space-y-6">
      {/* Project Board Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>

          {/* Project Title and Color Tag */}
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#5B5BD6' }}
            />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
          </div>

          {project.description && (
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Right header meta: Owner & Target Date */}
        <div className="flex items-center gap-3">
          {project.deadline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                Target: {new Date(project.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}

          {ownerObj && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <Avatar src={ownerObj.avatar} name={ownerObj.name} size="xs" />
              <span className="font-medium hidden sm:inline">{ownerObj.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Flagship Interactive Kanban Board */}
      <KanbanBoard project={project} />

      {/* Task Modal triggered by deep link (?task=...) */}
      {urlTaskId && (
        <TaskModal
          taskId={urlTaskId}
          isOpen={true}
          onClose={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
          onTaskUpdated={() => {}}
          onTaskDeleted={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
        />
      )}
    </div>
  );
};
