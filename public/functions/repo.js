export async function onRequestGet({ env }) {
  const query = `
    {
      repository(owner: "femboyjophiel", name: "femring") {
        stargazers {
          totalCount
        }
        forks {
          totalCount
        }
      }
    }
  `;

  const { data } = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'authorization': `bearer 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`,
      'user-agent': 'femboyjophiel'
    },
    body: JSON.stringify({ query })
  }).then(r => r.json());

  const repositoryData = data.repository;

  const result = {
    star: repositoryData.stargazers.totalCount,
    fork: repositoryData.forks.totalCount
  };

  return new Response(JSON.stringify(result), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600'
    }
  });
}

//  a: repository(owner: "femboyjophiel", name: "jophiel.org") { stargazers { totalCount } forks { totalCount } }