import { url } from "node:inspector";

import { PlusIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "../../components/modal.js";
import { Select } from "../../components/select.js";
import { openPopupWindow } from "../../utils/popup-window.js";
import { trpc } from "../../utils/trpc.js";

const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

export const Component = () => {
  const userId = trpc["self"].useQuery();
  const [projectName, setProjectName] = useState("");
  const [installationId, setInstallationId] = useState("");
  const [repositoryId, setRepositoryId] = useState("");
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  const installations = trpc["github.listInstallations"].useQuery();
  const repos = trpc["github.listRepos"].useQuery(
    {
      installationId: installationId || "",
    },
    {
      enabled: !!installationId,
    },
  );

  const projectsList = trpc["user.listProjects"].useQuery(
    {
      owner: userId.data?.userId || "",
    },
    {
      enabled: !!userId.data?.userId,
    },
  );

  const createProjectMutation = trpc["user.createProject"].useMutation();

  const createProject = useCallback(async () => {
    if (!repositoryId || !installationId || !projectName) {
      return;
    }

    await createProjectMutation.mutateAsync({
      repositoryId,
      projectName,
      owner: userId.data?.userId || "",
    });

    setShowAddProjectModal(false);
    projectsList.refetch();
  }, [installationId, repositoryId, installations, createProjectMutation]);

  return (
    <>
      <div className="space-y-4">
        <div className="gap-2 w-full">
          <h1 className="flex justify-between items-center">
            <span className="font-semibold text-xl">Projects</span>
            <span className="text-gray-500">({userId.data?.userId})</span>
          </h1>

          <div className="flex flex-wrap gap-4 pt-4">
            {projectsList.data &&
              projectsList.data.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col justify-center items-center w-32 h-32 rounded-lg border border-gray-300 p-4 hover:bg-gray-100 transition duration-300"
                >
                  <div className="text-center">{project.name}</div>
                </div>
              ))}
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex flex-col justify-center items-center w-32 h-32 rounded-lg border border-gray-300 p-4 bg-sky-50 transition duration-300"
            >
              <div className="text-center">
                <PlusIcon className="w-8 h-8 text-sky-600" />
              </div>
            </button>
          </div>
        </div>

        <p>
          <Link to="/">Go to the home page</Link>
        </p>
      </div>

      <Modal
        visible={showAddProjectModal}
        setVisible={setShowAddProjectModal}
        className="w-[25rem] bg-white"
      >
        <div className="space-y-6">
          <h1 className="text-xl font-bold">Create Project</h1>

          <div className="text-sm">
            <input
              className="w-full p-2 rounded border focus:outline-none mb-4 bg-sky-50"
              placeholder="Project Name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />

            <div className="gap-4 mb-4 flex flex-col">
              <Select
                items={(installations.data || []).map((installation) => ({
                  value: installation.id.toString(),
                  label: installation.name || "",
                }))}
                placeholder="Select a Git namespace"
                onChange={setInstallationId}
                value={installationId.toString()}
                btnClassName="w-full bg-sky-50 py-2 rounded border"
              />

              <Select
                items={(repos.data || []).map((repo) => ({
                  value: repo.id.toString(),
                  label: repo.name,
                }))}
                placeholder="Select a repository"
                onChange={setRepositoryId}
                value={repositoryId}
                btnClassName="w-full bg-sky-50 py-2 rounded border"
              />
            </div>
            <div className="flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded focus:outline-none"
                onClick={createProject}
              >
                Create Project
              </button>
            </div>
          </div>

          <div className="text-xs space-y-2 text-center">
            <p className="">Missing Git repository?</p>
            <button
              className="text-blue-600"
              onClick={() =>
                openPopupWindow({
                  url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
                })
              }
            >
              Adjust GitHub App Permissions →
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
