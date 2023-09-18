import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Modal } from "../../components/modal.js";
import { Select } from "../../components/select.js";
import { trpc } from "../../utils/trpc.js";

const GITHUB_APP_NAME = import.meta.env["GITHUB_APP_NAME"];

export const Component = () => {
  const [installationId, setInstallationId] = useState<string>();
  const [repoId, setRepoId] = useState<string>();

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  const installations = trpc["github/list-installations"].useQuery();
  const repos = trpc["github/list-repos"].useQuery(
    {
      installationId: installationId || "",
    },
    {
      enabled: !!installationId,
    },
  );

  return (
    <>
      <div className="space-y-4">
        <div className="gap-2 w-full">
          <h1 className="font-semibold">Projects</h1>

          <div className="flex flex-col items-center justify-center gap-y-2 pt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="
                    M12 4v16m8-8H4
                  "
              />
            </svg>
            <p className="text-gray-400">No Projects</p>

            <button
              className={clsx(
                "bg-slate-500 hover:bg-slate-600 text-white py-1 px-2 rounded",
                "focus:outline-none focus:shadow-outline",
              )}
              onClick={() => setShowAddProjectModal(true)}
            >
              Create Project
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
        className="min-w-[80vw] space-y-1.5"
      >
        <div className="text-md space-x-1 w-full space-y-2">
          <h1 className="text-xl">Create Project</h1>
          <Select
            className="mt-2"
            items={
              installations.data?.map((installation) => ({
                value: installation.id.toString(),
                label: installation.name,
              })) ?? []
            }
            placeholder="Select a Git namespace"
            onChange={setInstallationId}
            value={installationId?.toString() ?? ""}
            btnClassName={clsx(
              "text-xs text-left outline-none rounded-l",
              "pl-2.5 pr-6 py-1.5",
              "border",
            )}
          />

          <Select
            className="mt-2"
            items={
              repos.data?.map((repo) => ({
                value: repo.id.toString(),
                label: repo.name,
              })) ?? []
            }
            placeholder="Select a repository"
            onChange={setRepoId}
            value={repoId ?? ""}
            btnClassName={clsx(
              "text-xs text-left outline-none rounded-l",
              "pl-2.5 pr-6 py-1.5",
              "border",
            )}
          />

          <p className="text-xs">
            Missing Git repository?{" "}
            <a
              href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`}
              target="__blank"
              className="text-sky-600"
            >
              Adjust GitHub App Permissions →
            </a>
          </p>
        </div>
      </Modal>
    </>
  );
};
