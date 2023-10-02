**wing.cloud User Story 28-09-23**


In this user story there are two personas: A ***Wing Cloud user (Batz)*** and a ***core developer in the Wing Cloud team (Pol)***.

Batz, a true wingnut, develop his first production grade Wing application and wants to easily test and review his PRs before merging them.

Batz navigates to dev.wingcloud.io (our demo site), clicks 'Sign in with GitHub', and is redirected to dev.wingcloud.io/projects after successful sign-in.
Batz clicks "create project" and installs the Wing Cloud GitHub application in one of his repositories.
When Batz creates a new PR in his repository, a new preview environment is automatically created for that PR.
In the PR, Batz will see a comment with a direct link to his preview environment.

Pol will ensure all the above functionality works during development using the Wing Console.
Pol will use a testing GitHub account and repository to simulate the sign-in process and installation of the GitHub application.
Pol's development environment includes a reverse proxy and React website resources for the frontend, a local DynamoDB and API resources for the backend, and he will use Docker containers to simulate fly.io machines for preview environments.

