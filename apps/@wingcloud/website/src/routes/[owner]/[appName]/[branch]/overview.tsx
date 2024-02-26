import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../../components/page-header.js";
import { SectionTitle } from "../../../../components/section-title.js";
import { wrpc } from "../../../../utils/wrpc.js";

import { Endpoints } from "./_components/endpoints.js";
import { EnvironmentDetails } from "./_components/environment-details.js";

const Overview = ({
  owner,
  appName,
  branch,
}: {
  owner: string;
  appName: string;
  branch: string;
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const getAppQuery = wrpc["app.getByName"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );
  const app = useMemo(() => {
    return getAppQuery.data?.app;
  }, [getAppQuery.data]);

  const environmentQuery = wrpc["app.environment"].useQuery({
    owner: owner!,
    appName: appName!,
    branch: branch!,
  });
  const environment = useMemo(() => {
    return environmentQuery.data?.environment;
  }, [environmentQuery.data]);

  const endpointsQuery = wrpc["app.environment.endpoints"].useQuery(
    {
      appName: appName!,
      branch: environment?.branch!,
    },
    {
      enabled: !!appName && environment?.status === "running",
    },
  );
  const endpoints = useMemo(() => {
    if (!endpointsQuery.data) {
      return [];
    }
    return endpointsQuery.data?.endpoints.sort((a, b) => {
      return a.label.localeCompare(b.label);
    });
  }, [endpointsQuery.data]);

  const [showRestartModal, setShowRestartModal] = useState(false);

  const deploying = useMemo(() => {
    if (!environment?.status) {
      return false;
    }

    return STARTING_STATUS.includes(environment.status);
  }, [environment?.status]);

  return (
    <>
      <PageHeader
        icon={<BranchIcon className="size-full" />}
        title={branch!}
        noBackground
        actions={
          <>
            <Button
              disabled={environment?.status !== "running"}
              icon={CommandLineIcon}
              onClick={() => {
                navigate(`/${owner}/${appName}/${environment?.branch}/console`);
              }}
            >
              Console
            </Button>
            <Button
              disabled={!VALID_REDEPLOY_STATUS.includes(environment?.status!)}
              icon={ArrowPathIcon}
              iconClassName={clsx(deploying && "animate-spin")}
              onClick={() => {
                setShowRestartModal(true);
              }}
            >
              {deploying ? "Deploying..." : "Redeploy"}
            </Button>
          </>
        }
      />
      <div
        className={clsx(
          "relative transition-all pb-4",
          theme.pageMaxWidth,
          theme.pagePadding,
          "space-y-4",
        )}
      >
        <div className="space-y-2">
          <SectionTitle>Overview</SectionTitle>
          <EnvironmentDetails
            owner={owner}
            app={app}
            loading={environmentQuery.isLoading}
            environment={environment}
            actions={
              <Link
                to={`/${owner}/${appName}/${environment?.branch}/console`}
                onClick={(e) => {
                  if (environment?.status !== "running") {
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  "z-10",
                  "inline-flex gap-2 items-center text-xs font-medium outline-none rounded-md",
                  "px-2.5 py-2 border shadow-sm",
                  theme.borderInput,
                  theme.focusVisible,
                  theme.bgInput,
                  theme.bgInputHover,
                  theme.textInput,
                  environment?.status !== "running" &&
                    "cursor-not-allowed opacity-50",
                )}
              >
                Console
              </Link>
            }
          />
        </div>
        <div className="space-y-2">
          <SectionTitle>Endpoints</SectionTitle>
          <Endpoints
            endpoints={endpoints}
            loading={endpointsQuery.isLoading}
            environment={environment}
          />
        </div>
      </div>
      <RedeployEnvironmentModal
        owner={owner}
        appName={appName}
        branch={branch}
        show={showRestartModal}
        onClose={() => {
          setShowRestartModal(false);
        }}
      />
    </>
  );
};

export const Component = () => {
  const { owner, appName, "*": branch } = useParams();
  return <Overview owner={owner!} appName={appName!} branch={branch!} />;
};
