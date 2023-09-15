import clsx from "clsx";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "../../components/modal.js";
import { Select } from "../../components/select.js";
import { trpc } from "../../utils/trpc.js";

export const Component = () => {
  const projects = trpc["github/list-projects"].useQuery();
  const installations = trpc["github/list-installations"].useQuery();

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  return (
    <>
      <h1>Projects</h1>

      <button
        className={clsx(
          "bg-slate-500 hover:bg-slate-600 text-white py-1 px-2 rounded",
          "focus:outline-none focus:shadow-outline",
        )}
        onClick={() => setShowAddProjectModal(true)}
      >
        Create Project
      </button>

      <div className="p-6">
        <h2 className="text-xl">Installations</h2>
        <ul className="pl-2">
          {installations.data?.map((project) => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
      </div>

      <Modal
        visible={showAddProjectModal}
        setVisible={setShowAddProjectModal}
        className="max-w-2xl w-full"
      >
        <h1 className="text-xl">Create Project</h1>
        <Select
          className="mt-2"
          items={
            projects.data?.map((project) => ({
              value: project.id.toString(),
              label: project.name,
            })) ?? []
          }
          placeholder="Project"
          onChange={(value) => {
            setSelectedProject(value);
          }}
          value={selectedProject ?? ""}
        />
      </Modal>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
};
