bring ex;

bring "./github.w" as github;

pub struct GithubAccessTokensTableProps {
  encryptionKey: str;
}

/**
 * A table that stores Github access tokens.
 */
pub class GithubAccessTokensTable {
  encryptionKey: str;

  table: ex.Table;

  new(props: GithubAccessTokensTableProps) {
    this.encryptionKey = props.encryptionKey;

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
      accessToken: GithubAccessTokensTable.encrypt(tokens.access_token, this.encryptionKey),
      expiresIn: tokens.expires_in,
      refreshToken: GithubAccessTokensTable.encrypt(tokens.refresh_token, this.encryptionKey),
      refreshTokenExpiresIn: tokens.refresh_token_expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    });
  }

  pub inflight get(userId: str): github.AuthTokens? {
    if let item = this.table.tryGet(userId) {
      return {
        access_token: GithubAccessTokensTable.decrypt(item.get("accessToken").asStr(), this.encryptionKey),
        expires_in: item.get("expiresIn").asNum(),
        refresh_token:GithubAccessTokensTable.decrypt( item.get("refreshToken").asStr(), this.encryptionKey),
        refresh_token_expires_in: item.get("refreshTokenExpiresIn").asNum(),
        token_type: item.get("tokenType").asStr(),
        scope: item.get("scope").asStr(),
      };
    }
  }

  extern "./github-tokens-table.mts" static inflight encrypt(text: str, key: str): str;
  extern "./github-tokens-table.mts" static inflight decrypt(text: str, key: str): str;
}
