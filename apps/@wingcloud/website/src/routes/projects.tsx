import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { GithubIcon } from "../icons/github-icon.js";
import { wrpc, type Project } from "../utils/wrpc.js";

const getDateTime = (datetime: string) => {
  const date = new Date(datetime);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

const getTimeFromNow = (datetime: string) => {
  const date = new Date(datetime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 24) {
    return getDateTime(datetime);
  }

  if (hours > 0) {
    return `${hours} hours ago`;
  }

  if (minutes > 0) {
    return `${minutes} minutes ago`;
  }

  return `${seconds} seconds ago`;
};

const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="w-full">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 flex py-2.5 pl-2.5">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
        </div>
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          className={clsx(
            "block w-full rounded-lg shadow border-0 py-1.5 pl-10",
            "text-slate-700",
            "placeholder:text-slate-300 placeholder:font-light",
            "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
          )}
        />
      </div>
    </div>
  );
};

const NewProjectButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "justify-center items-center rounded-lg shadow border-0 pl-2 pr-3",
        " transition duration-300",
        "bg-sky-600 text-white",
        "hover:bg-sky-500",
        "flex gap-x-1 text-xs",
      )}
    >
      <PlusIcon className="w-4 h-4" />
      Project
    </button>
  );
};

const ProjectItem = ({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 bg-white rounded-lg",
        "shadow hover:shadow-md transition-all",
      )}
    >
      <div className="space-y-4">
        <div className="flex gap-x-2">
          {project.imageUrl && (
            <img src={project.imageUrl} className="w-10 h-10 rounded-full" />
          )}
          {!project.imageUrl && (
            <div className="w-10 h-10 rounded-full bg-sky-50 flex justify-center items-center">
              <div className="text-sky-600">{project.name[0]}</div>
            </div>
          )}
        </div>

        <div className="text-left w-full truncate space-y-1">
          <div className="text-lg text-slate-800">{project.name}</div>
          <div className="text-xs text-slate-600 truncate flex gap-x-1">
            {project.description && (
              <GithubIcon className="w-4 text-slate-700" />
            )}{" "}
            {project.description || project.entryfile}
          </div>
        </div>
      </div>

      <div className="text-xs mt-3 h-full flex items-end">
        <div className="text-slate-600">
          Updated {getTimeFromNow(project.updatedAt)}{" "}
          {project.updatedBy && `by ${project.updatedBy}`}
        </div>
      </div>
    </button>
  );
};

export const Component = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const projectsList = wrpc["user.listProjects"].useQuery();

  const projects = useMemo(() => {
    if (!projectsList.data) {
      return [];
    }
    return projectsList.data.projects.filter((project) =>
      project.name.includes(search),
    );
  }, [projectsList.data, search]);

  return (
    <>
      <Header breadcrumbs={[{ label: "Projects", to: "/projects" }]} />

      <div className="p-6 space-y-4 w-full max-w-5xl mx-auto">
        <div className="flex gap-x-2">
          <SearchBar value={search} onChange={setSearch} />
          <NewProjectButton
            onClick={() => {
              navigate("/new");
            }}
          />
        </div>

        {projectsList.isLoading && (
          <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <SpinnerLoader />
          </div>
        )}

        {!projectsList.isLoading && projects.length === 0 && (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No projects found.
            </h3>

            {projectsList.data?.projects.length === 0 && (
              <>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new project.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className={clsx(
                      "inline-flex items-center rounded-md bg-sky-600 px-3 py-2",
                      "text-sm font-semibold text-white shadow-sm hover:bg-sky-500 ",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                    )}
                    onClick={() => {
                      navigate("/new");
                    }}
                  >
                    <svg
                      className="-ml-0.5 mr-1.5 h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    New Project
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div
          className={clsx(
            "flex flex-wrap gap-6 w-full",
            "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1",
          )}
        >
          {projects.map((project) => (
            <ProjectItem
              key={project.id}
              onClick={() => {
                navigate(`/projects/${project.id}`);
              }}
              project={project}
            />
          ))}
        </div>
      </div>
    </>
  );
};
