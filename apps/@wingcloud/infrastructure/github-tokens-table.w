
bring ex;

bring "./github.w" as github;

/**
 * A table that stores Github access tokens.
 */
pub class GithubAccessTokensTable {
  table: ex.Table;

  new() {
    this.table = new ex.Table(
      name: "github-access-tokens",
      primaryKey: "userId",
      columns: {
        userId: ex.ColumnType.STRING,
        accessToken: ex.ColumnType.STRING,
        expiresIn: ex.ColumnType.NUMBER,
        refreshToken: ex.ColumnType.STRING,
        refreshTokenExpiresIn: ex.ColumnType.NUMBER,
        tokenType: ex.ColumnType.STRING,
        scope: ex.ColumnType.STRING,
      },
    );
  }

  pub inflight set(userId: str, tokens: github.AuthTokens) {
    this.table.upsert(userId, {
      userId: userId,
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      refreshToken: tokens.refresh_token,
      refreshTokenExpiresIn: tokens.refresh_token_expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    });
  }

  pub inflight get(userId: str): github.AuthTokens? {
    if let item = this.table.tryGet(userId) {
      return {
        access_token: item.get("accessToken").asStr(),
        expires_in: item.get("expiresIn").asNum(),
        refresh_token: item.get("refreshToken").asStr(),
        refresh_token_expires_in: item.get("refreshTokenExpiresIn").asNum(),
        token_type: item.get("tokenType").asStr(),
        scope: item.get("scope").asStr(),
      };
    }
  }
}
