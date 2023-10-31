import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/header.js";
import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

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
            "block w-full rounded-md shadow border-0 py-1.5 pl-10",
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
        "justify-center items-center rounded-md border-0 px-2",
        " transition duration-300",
        "bg-emerald-400 text-slate-700",
        "hover:bg-emerald-500 hover:text-white",
        "flex gap-x-1 text-xs",
      )}
    >
      <PlusIcon className="w-4 h-4 " />
      Project
    </button>
  );
};

const ProjectItem = ({
  name,
  entryfile,
  onClick,
}: {
  name: string;
  entryfile: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full h-40",
        "flex flex-col justify-center items-center rounded-lg",
        "border border-gray-300 p-4 transition duration-300",
        "bg-white hover:bg-gray-100",
      )}
    >
      <div className="text-center">{name}</div>
      <div className="text-center">{entryfile}</div>
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
      <Header title="Projects" />
      <div className="px-6 space-y-4">
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

        <div className="flex flex-wrap gap-2 w-full">
          {projects.map((project) => (
            <div
              key={project.id}
              className={clsx("w-1/4 flex justify-center items-center")}
            >
              <ProjectItem
                key={project.id}
                onClick={() => {
                  navigate(`/projects/${project.id}`);
                }}
                name={project.name}
                entryfile={project.entryfile}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
